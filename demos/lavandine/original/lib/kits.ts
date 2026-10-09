import type { ItemKit, Produto, Venda } from "./domain";

export function validarItensKit(produtos: Produto[], itens: ItemKit[], kitId?: string) {
  if (!itens.length) return "Adicione pelo menos um produto ao kit.";
  const ids = new Set<string>();
  for (const item of itens) {
    const produto = produtos.find((produto) => produto.id === item.produtoId);
    if (!produto || produto.id === kitId || produto.categoria === "Kits") {
      return "Escolha produtos existentes para montar o kit. Kits não podem conter outros kits.";
    }
    if (!Number.isSafeInteger(item.quantidade) || item.quantidade <= 0) {
      return "Informe uma quantidade inteira maior que zero para cada produto do kit.";
    }
    if (ids.has(item.produtoId)) return "Cada produto deve aparecer uma vez na composição do kit.";
    ids.add(item.produtoId);
  }
  return null;
}

export function disponibilidadeKit(produtos: Produto[], itens: ItemKit[]) {
  if (validarItensKit(produtos, itens)) return 0;
  return Math.max(
    0,
    Math.min(
      ...itens.map((item) => {
        const produto = produtos.find((produto) => produto.id === item.produtoId)!;
        return Math.floor(produto.quantidade / item.quantidade);
      }),
    ),
  );
}

export function custoKit(produtos: Produto[], itens: ItemKit[]) {
  return itens.reduce(
    (soma, item) =>
      soma +
      (produtos.find((produto) => produto.id === item.produtoId)?.custoEstimado ?? 0) *
        item.quantidade,
    0,
  );
}

export function atualizarDisponibilidadeKits(produtos: Produto[]): Produto[] {
  return produtos.map((produto) =>
    produto.categoria === "Kits"
      ? {
          ...produto,
          quantidade: disponibilidadeKit(produtos, produto.kitItens ?? []),
          custoEstimado: custoKit(produtos, produto.kitItens ?? []),
        }
      : produto,
  );
}

export function consumoDaVenda(produtos: Produto[], venda: Pick<Venda, "itens">) {
  const consumo: Record<string, number> = {};
  for (const item of venda.itens) {
    const produto = produtos.find((produto) => produto.id === item.produtoId);
    if (item.categoria === "Kits" || produto?.categoria === "Kits") {
      const componentes = item.kitItens ?? produto?.kitItens ?? [];
      if (!componentes.length) throw new Error("O kit não possui uma composição válida.");
      if (!Number.isSafeInteger(item.quantidade) || item.quantidade <= 0) {
        throw new Error("Informe uma quantidade inteira de kits maior que zero.");
      }
      for (const componente of componentes) {
        consumo[componente.produtoId] =
          (consumo[componente.produtoId] ?? 0) + item.quantidade * componente.quantidade;
      }
    } else {
      consumo[item.produtoId] = (consumo[item.produtoId] ?? 0) + item.quantidade;
    }
  }
  return consumo;
}

export function aplicarVendaComKits(
  produtos: Produto[],
  venda: Pick<Venda, "itens">,
  anterior?: Pick<Venda, "itens">,
) {
  const consumo = consumoDaVenda(produtos, venda);
  const devolucao = anterior ? consumoDaVenda(produtos, anterior) : {};
  for (const [id, quantidade] of Object.entries(consumo)) {
    const produto = produtos.find((produto) => produto.id === id && produto.categoria !== "Kits");
    if (!produto || produto.quantidade + (devolucao[id] ?? 0) < quantidade) {
      throw new Error(`Estoque insuficiente de ${produto?.nome ?? "um produto do kit"}.`);
    }
  }
  return atualizarDisponibilidadeKits(
    produtos.map((produto) =>
      produto.categoria === "Kits"
        ? produto
        : {
            ...produto,
            quantidade:
              produto.quantidade + (devolucao[produto.id] ?? 0) - (consumo[produto.id] ?? 0),
          },
    ),
  );
}
