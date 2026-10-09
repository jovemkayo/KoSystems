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

  it("calcula o peso no PDV e fecha a comanda", () => {
    render(<ProjectDemo kind="pos" />);
    fireEvent.click(screen.getByRole("tab", { name: "Balança" }));
    fireEvent.change(screen.getByLabelText("Peso em kg"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Lançar pesagem" }));
    fireEvent.click(screen.getByRole("tab", { name: "Caixa" }));
    expect(screen.getByText("R$ 67,00")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Fechar pagamento" }));
    expect(screen.getByRole("status")).toHaveTextContent("Pagamento concluído");
  });

  it("registra uma venda e atualiza o estoque correspondente", () => {
    render(<ProjectDemo kind="management" />);
    fireEvent.click(screen.getByRole("tab", { name: "Vendas" }));
    fireEvent.click(screen.getByRole("button", { name: "Registrar venda de exemplo" }));
    fireEvent.click(screen.getByRole("tab", { name: "Estoque" }));
    expect(screen.getByRole("row", { name: /Produto A.*23 un/i })).toBeVisible();
  });

  it("interpreta texto editado e envia os itens para separação", () => {
    render(<ProjectDemo kind="document" />);
    fireEvent.change(screen.getByLabelText("Pedido recebido"), {
      target: { value: "3 kg cenoura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /processar exemplo/i }));
    expect(screen.getByRole("row", { name: /cenoura 3 kg/i })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Enviar para separação" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /cenoura/i }));
    expect(screen.getByRole("status")).toHaveTextContent("1 de 1 itens separados");
  });

  it("filtra linhas e registra troca de responsável no histórico", () => {
    render(<ProjectDemo kind="lines" />);
    fireEvent.change(screen.getByLabelText("Buscar número ou responsável"), {
      target: { value: "Pessoa A" },
    });
    expect(screen.getAllByRole("button", { name: "Trocar responsável" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Trocar responsável" }));
    fireEvent.click(screen.getByRole("tab", { name: "Histórico" }));
    expect(screen.getByText(/Pessoa A para Pessoa C/)).toBeVisible();
  });

  it("descarta o pedido interpretado quando o texto recebido muda", () => {
    render(<ProjectDemo kind="document" />);
    fireEvent.click(screen.getByRole("button", { name: /processar exemplo/i }));
    fireEvent.change(screen.getByLabelText("Pedido recebido"), {
      target: { value: "pedido inválido" },
    });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /processar exemplo/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Use uma linha por item");
  });
});
