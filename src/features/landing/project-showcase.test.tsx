// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { projects } from "./content";
import { ProjectShowcase } from "./project-showcase";

afterEach(cleanup);

describe("ProjectShowcase", () => {
  it("apresenta três relatos sem fotos inventadas nem textos de propriedade", () => {
    const { container } = render(<ProjectShowcase projects={projects} />);
    expect(container.querySelectorAll("blockquote")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.queryByText(/de propriedade/)).not.toBeInTheDocument();
    expect(screen.getByText(/Eu levava cerca de 1h30min/)).toBeVisible();
  });
  it("oferece três estudos de caso com demonstrações acessíveis", () => {
    render(<ProjectShowcase projects={projects} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName();
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button.textContent).not.toBe("");
      expect(button).toHaveTextContent("Abrir demonstração interativa");
    }
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByRole("heading", { name: /30 minutos.*caixa/i })).toBeVisible();
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
    fireEvent.click(screen.getByRole("button", { name: /orderwb/i }));
    expect(screen.getByRole("dialog", { name: "OrderWB" })).toBeVisible();
    expect(screen.getByTitle("Demonstração de OrderWB")).toHaveAttribute(
      "src",
      "/demos/orderworkbench/index.html",
    );
    expect(screen.queryByRole("button", { name: /adicionar suco/i })).not.toBeInTheDocument();
  });
  it("abre diretamente a aplicação sem uma segunda apresentação da solução", () => {
    render(<ProjectShowcase projects={projects} />);
    fireEvent.click(screen.getByRole("button", { name: /pdv restaurante/i }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleDescription("Demonstração interativa · Dados fictícios");
    expect(
      within(dialog).queryByRole("button", { name: "Conheça a solução" }),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByTitle("Demonstração de Estalagem Restaurante")).toHaveAttribute(
      "src",
      "/demos/estalagem/index.html",
    );
    expect(within(dialog).getAllByRole("button")).toHaveLength(2);
  });
});
