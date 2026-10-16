// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { projects } from "./content";
import { ProjectShowcase } from "./project-showcase";

afterEach(cleanup);

describe("ProjectShowcase", () => {
  it("oferece três estudos de caso com demonstrações acessíveis", () => {
    render(<ProjectShowcase projects={projects} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button.textContent).not.toBe("");
    }
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: /30 minutos para um clique/i })).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: /orderworkbench/i }));
    expect(screen.getByRole("dialog", { name: "OrderWorkbench" })).toBeVisible();
    expect(screen.getByTitle("Demonstração de OrderWorkbench")).toHaveAttribute(
      "src",
      "/demos/orderworkbench/index.html",
    );
    expect(screen.queryByRole("button", { name: /adicionar suco/i })).not.toBeInTheDocument();
  });
  it("abre a explicação apenas ao clicar e mantém a demonstração ao expandir", () => {
    render(<ProjectShowcase projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: /pdv restaurante/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Demonstração interativa · Dados fictícios");
    expect(within(dialog).queryByText("Explore as telas")).not.toBeInTheDocument();
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
