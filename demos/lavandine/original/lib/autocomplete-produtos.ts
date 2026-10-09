import { medidaProduto, type Produto } from "./domain";

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function textoPesquisavel(produto: Produto) {
  return normalizarTexto(
    [produto.nome, produto.essencia, produto.categoria, medidaProduto(produto)]
      .filter(Boolean)
      .join(" "),
  );
}

export function sugestoesProdutos(
  produtos: Produto[],
  busca: string,
  limite = Number.POSITIVE_INFINITY,
) {
  const termo = normalizarTexto(busca);
  const filtrados = termo
    ? produtos.filter((produto) => textoPesquisavel(produto).includes(termo))
    : produtos;

  return filtrados.slice(0, limite);
}
