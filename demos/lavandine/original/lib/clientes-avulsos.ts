import type { Venda } from "./domain";

function normalizarNome(nome: string) {
  return nome.trim().toLocaleLowerCase("pt-BR");
}

export function clientesAvulsosDasVendas(vendas: Venda[]) {
  const nomes = new Map<string, string>();

  vendas.forEach((venda) => {
    if (venda.clienteId) return;

    const nome = venda.cliente?.trim();
    if (!nome) return;

    nomes.set(normalizarNome(nome), nome);
  });

  return Array.from(nomes.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function vendasDoClienteAvulso(vendas: Venda[], nome: string) {
  const nomeNormalizado = normalizarNome(nome);

  return vendas.filter(
    (venda) =>
      !venda.clienteId &&
      Boolean(venda.cliente?.trim()) &&
      normalizarNome(venda.cliente ?? "") === nomeNormalizado,
  );
}
