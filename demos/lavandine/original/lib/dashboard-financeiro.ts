import { dataBR, totalVenda, type Cliente, type Venda } from "./domain";
import { totalPagoVenda, totalPendenteVenda } from "./pagamentos-venda";

export type ClienteACobrar = {
  chave: string;
  clienteId?: string;
  nome: string;
  totalPendente: number;
  vendasPendentes: number;
  proximoVencimento?: string;
  atrasado: boolean;
};

export type ResumoFinanceiroDashboard = {
  totalVendido: number;
  totalRecebido: number;
  totalPendente: number;
  clientesACobrar: ClienteACobrar[];
};

function normalizarNome(nome: string) {
  return nome.trim().toLocaleLowerCase("pt-BR");
}

export function rotuloVencimentoCobranca(
  cliente: Pick<ClienteACobrar, "proximoVencimento" | "atrasado">,
) {
  if (!cliente.proximoVencimento) return "sem vencimento informado";
  return cliente.atrasado
    ? `vencido em ${dataBR(cliente.proximoVencimento)}`
    : `próximo em ${dataBR(cliente.proximoVencimento)}`;
}

export function resumoFinanceiroDashboard(
  vendas: Venda[],
  clientes: Cliente[],
  hoje: string,
): ResumoFinanceiroDashboard {
  const clientesPorId = new Map(clientes.map((cliente) => [cliente.id, cliente.nome]));
  const cobrancas = new Map<string, ClienteACobrar>();

  vendas.forEach((venda) => {
    const totalPendente = totalPendenteVenda(venda);
    if (totalPendente <= 0) return;

    const nomeAvulso = venda.cliente?.trim();
    const chave = venda.clienteId
      ? `cliente:${venda.clienteId}`
      : nomeAvulso
        ? `avulso:${normalizarNome(nomeAvulso)}`
        : `venda:${venda.id}`;
    const nome = venda.clienteId
      ? (clientesPorId.get(venda.clienteId) ?? nomeAvulso ?? "Cliente não informado")
      : (nomeAvulso ?? "Cliente não informado");
    const vencimentos = (venda.pagamentos ?? [])
      .filter((pagamento) => !pagamento.pago)
      .map((pagamento) => pagamento.data)
      .filter(Boolean)
      .sort();
    const proximoVencimento = vencimentos[0];
    const atual = cobrancas.get(chave);
    const vencimentoAtual = atual?.proximoVencimento;
    const menorVencimento = [vencimentoAtual, proximoVencimento]
      .filter((data): data is string => Boolean(data))
      .sort()[0];

    cobrancas.set(chave, {
      chave,
      ...(venda.clienteId ? { clienteId: venda.clienteId } : {}),
      nome: atual?.nome ?? nome,
      totalPendente: (atual?.totalPendente ?? 0) + totalPendente,
      vendasPendentes: (atual?.vendasPendentes ?? 0) + 1,
      ...(menorVencimento ? { proximoVencimento: menorVencimento } : {}),
      atrasado: Boolean(menorVencimento && menorVencimento < hoje),
    });
  });

  return {
    totalVendido: vendas.reduce((soma, venda) => soma + totalVenda(venda), 0),
    totalRecebido: vendas.reduce((soma, venda) => soma + totalPagoVenda(venda), 0),
    totalPendente: vendas.reduce((soma, venda) => soma + totalPendenteVenda(venda), 0),
    clientesACobrar: Array.from(cobrancas.values()).sort((a, b) => {
      if (a.proximoVencimento && b.proximoVencimento) {
        return (
          a.proximoVencimento.localeCompare(b.proximoVencimento) ||
          b.totalPendente - a.totalPendente ||
          a.nome.localeCompare(b.nome, "pt-BR")
        );
      }
      if (a.proximoVencimento) return -1;
      if (b.proximoVencimento) return 1;
      return b.totalPendente - a.totalPendente || a.nome.localeCompare(b.nome, "pt-BR");
    }),
  };
}
