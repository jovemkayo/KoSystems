import { totalVenda, type StatusPagamento, type Venda } from "./domain";

export function totalPagoVenda(venda: Venda) {
  if (!venda.pagamentos?.length) return totalVenda(venda);
  return venda.pagamentos
    .filter((pagamento) => pagamento.pago)
    .reduce((soma, pagamento) => soma + pagamento.valor, 0);
}

export function totalPendenteVenda(venda: Venda) {
  return Math.max(0, totalVenda(venda) - totalPagoVenda(venda));
}

export function statusPagamentoVenda(venda: Venda): StatusPagamento {
  const pago = totalPagoVenda(venda);
  const pendente = totalPendenteVenda(venda);

  if (pendente <= 0) return "pago";
  if (pago <= 0) return "pendente";
  return "parcial";
}

export function tomStatusPagamento(status: StatusPagamento) {
  if (status === "pago") return "positive" as const;
  if (status === "parcial") return "warning" as const;
  return "negative" as const;
}
