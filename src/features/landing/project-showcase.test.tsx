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
    expect(screen.getByRole("dialog", { name: "Referência RH" })).toBeVisible();
    expect(screen.getByTitle("Demonstração de Referência RH")).toHaveAttribute(
      "src",
      "/demos/reference/index.html",
    );
    expect(screen.queryByRole("button", { name: /adicionar suco/i })).not.toBeInTheDocument();
  });
  it("abre a explicação apenas ao clicar e mantém a demonstração ao expandir", () => {
    render(<ProjectShowcase projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: /pdv restaurante/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Explore as telas");
    const frame = within(dialog).getByTitle("Demonstração de Estalagem Restaurante");
    const toggle = within(dialog).getByRole("button", { name: "Conheça a solução" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.mouseOver(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByRole("region", { name: "Conheça a solução" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "PDV para restaurante" })).toBeVisible();
    expect(within(dialog).queryByText("Alimentação")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument();
    expect(within(dialog).getByTitle("Demonstração de Estalagem Restaurante")).toBe(frame);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      within(dialog).queryByRole("region", { name: "Conheça a solução" }),
    ).not.toBeInTheDocument();
  });
});
