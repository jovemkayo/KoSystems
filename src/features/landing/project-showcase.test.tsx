// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { projects } from "./content";
import { ProjectShowcase } from "./project-showcase";

afterEach(cleanup);

describe("ProjectShowcase", () => {
  it("seleciona casos por clique e remove demonstrações que não pertencem ao caso", () => {
    render(<ProjectShowcase projects={projects} />);

    const lines = screen.getByRole("button", { name: /gestão de linhas/i });
    fireEvent.click(lines);
    expect(lines).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /gestão de linhas e dispositivos/i })).toBeVisible();
    expect(screen.queryByText("Dados fictícios")).not.toBeInTheDocument();

    const pos = screen.getByRole("button", { name: /pdv restaurante/i });
    fireEvent.click(pos);
    expect(pos).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Dados fictícios")).toBeVisible();
  });
});
