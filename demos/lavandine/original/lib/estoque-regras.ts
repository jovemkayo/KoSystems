import {
  novoId,
  type Compra,
  type InsumoEstoque,
  type Producao,
  type Produto,
  type Venda,
} from "./domain";

function textoBusca(valor: string) {
  return valor.trim().toLowerCase();
}

function mesmoInsumo(insumo: InsumoEstoque, compra: Compra) {
  return (
    textoBusca(insumo.nome) === textoBusca(compra.item) &&
    insumo.categoria === compra.categoria &&
    insumo.unidade === compra.unidade
  );
}

export function aplicarCompraNoEstoque(insumos: InsumoEstoque[], compra: Compra): InsumoEstoque[] {
  const existente = insumos.find((insumo) => mesmoInsumo(insumo, compra));

  if (!existente) {
    return [
      ...insumos,
      {
        id: novoId(),
        nome: compra.item,
        categoria: compra.categoria,
        quantidade: compra.quantidade,
        unidade: compra.unidade,
        custoUnitario: compra.valorUnitario,
        estoqueMinimo: 0,
      },
    ];
  }

  return insumos.map((insumo) => {
    if (insumo.id !== existente.id) return insumo;

    const valorAtual = insumo.quantidade * insumo.custoUnitario;
    const valorCompra = compra.quantidade * compra.valorUnitario;
    const quantidade = insumo.quantidade + compra.quantidade;

    return {
      ...insumo,
      quantidade,
      custoUnitario:
        quantidade > 0 ? (valorAtual + valorCompra) / quantidade : compra.valorUnitario,
    };
  });
}

export function aplicarVendaNoEstoque(produtos: Produto[], venda: Venda): Produto[] {
  const vendidosPorProduto = venda.itens.reduce<Record<string, number>>((acc, item) => {
    acc[item.produtoId] = (acc[item.produtoId] ?? 0) + item.quantidade;
    return acc;
  }, {});

  return produtos.map((produto) =>
    vendidosPorProduto[produto.id]
      ? {
          ...produto,
          quantidade: Math.max(0, produto.quantidade - (vendidosPorProduto[produto.id] ?? 0)),
        }
      : produto,
  );
}

export function aplicarProducaoNoEstoque(
  insumos: InsumoEstoque[],
  produtos: Produto[],
  producao: Producao,
) {
  const insumosAtualizados = insumos.map((insumo) => {
    const usado = producao.itens
      .filter((item) => item.insumoId === insumo.id)
      .reduce((soma, item) => soma + item.quantidade, 0);

    return usado > 0 ? { ...insumo, quantidade: Math.max(0, insumo.quantidade - usado) } : insumo;
  });

  const produtosAtualizados = produtos.map((produto) =>
    produto.id === producao.produtoId
      ? { ...produto, quantidade: produto.quantidade + producao.quantidadeProduzida }
      : produto,
  );

  return {
    insumos: insumosAtualizados,
    produtos: produtosAtualizados,
  };
}
