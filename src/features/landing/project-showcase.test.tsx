// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { projects } from "./content";
import { ProjectShowcase } from "./project-showcase";

afterEach(cleanup);

describe("ProjectShowcase", () => {
  it("identifica os quatro projetos por logos com botões acessíveis", () => {
    render(<ProjectShowcase projects={projects} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
      expect(button.querySelectorAll("img")).toHaveLength(1);
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button.textContent).not.toBe("");
    }
  });
  it("abre o projeto escolhido e descarta o estado da demonstração ao fechar", async () => {
    render(<ProjectShowcase projects={projects} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const pos = screen.getByRole("button", { name: /pdv restaurante/i });
    fireEvent.click(pos);
    const dialog = screen.getByRole("dialog", { name: "Estalagem Restaurante" });
    const originalFrame = within(dialog).getByTitle("Demonstração de Estalagem Restaurante");
    expect(originalFrame).toHaveAttribute("src", "/demos/estalagem/index.html");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reiniciar demonstração" }));
    expect(within(dialog).getByTitle("Demonstração de Estalagem Restaurante")).not.toBe(
      originalFrame,
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar projeto" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(pos).toHaveFocus());
    fireEvent.click(pos);
    expect(
      within(screen.getByRole("dialog")).getByTitle("Demonstração de Estalagem Restaurante"),
    ).not.toBe(originalFrame);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /gestão de linhas/i }));
    expect(screen.getByRole("dialog", { name: "Reference" })).toBeVisible();
    expect(screen.getByTitle("Demonstração de Reference")).toHaveAttribute(
      "src",
      "/demos/reference/index.html",
    );
    expect(screen.queryByRole("button", { name: /adicionar suco/i })).not.toBeInTheDocument();
  });
});
