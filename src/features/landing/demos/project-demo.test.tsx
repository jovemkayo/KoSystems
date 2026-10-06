// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProjectDemo } from "./project-demo";

afterEach(cleanup);

describe("ProjectDemo", () => {
  it("adiciona um item e atualiza o total do PDV", () => {
    render(<ProjectDemo kind="pos" />);
    expect(screen.getByText("R$ 42,00")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /adicionar suco/i }));
    expect(screen.getByText("R$ 50,00")).toBeVisible();
  });

  it("alterna a visão da gestão integrada", () => {
    render(<ProjectDemo kind="management" />);
    fireEvent.click(screen.getByRole("tab", { name: "Financeiro" }));
    expect(screen.getByText("Resultado do mês")).toBeVisible();
  });

  it("transforma o exemplo de documento em tabela", () => {
    render(<ProjectDemo kind="document" />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /processar exemplo/i }));
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByText("Tomate italiano")).toBeVisible();
  });
});
