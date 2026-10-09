// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { projects } from "./content";
import { ProjectShowcase } from "./project-showcase";

afterEach(cleanup);

describe("ProjectShowcase", () => {
  it("abre o projeto escolhido e descarta o estado da demonstração ao fechar", async () => {
    render(<ProjectShowcase projects={projects} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const pos = screen.getByRole("button", { name: /pdv restaurante/i });
    fireEvent.click(pos);
    const dialog = screen.getByRole("dialog", { name: "PDV para restaurante" });
    fireEvent.click(within(dialog).getByRole("button", { name: /adicionar suco/i }));
    expect(within(dialog).getByText("R$ 50,00")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar projeto" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(pos).toHaveFocus());
    fireEvent.click(pos);
    expect(within(screen.getByRole("dialog")).getByText("R$ 42,00")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /gestão de linhas/i }));
    expect(screen.getByRole("dialog", { name: "Gestão de linhas e dispositivos" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /adicionar suco/i })).not.toBeInTheDocument();
  });
});
