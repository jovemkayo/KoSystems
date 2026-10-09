import {
  statusEstoque,
  totalVenda,
  type Cliente,
  type InsumoEstoque,
  type Produto,
  type Venda,
} from "./domain";
import { statusPagamentoVenda } from "./pagamentos-venda";

export type OrdenacaoVendas =
  | "mais-recente"
  | "mais-antigo"
  | "cliente-az"
  | "produto-az"
  | "maior-valor"
  | "menor-valor"
  | "pendente-primeiro"
  | "pago-primeiro";

export type OrdenacaoClientes =
  "mais-recente" | "mais-antigo" | "nome-az" | "nome-za" | "completo-primeiro" | "aniversario";

export type OrdenacaoProdutos =
  | "mais-recente"
  | "mais-antigo"
  | "nome-az"
  | "nome-za"
  | "maior-estoque"
  | "menor-estoque"
  | "estoque-baixo"
  | "maior-valor"
  | "menor-valor"
  | "tipo"
  | "essencia";

export type OrdenacaoEstoque =
  | "mais-recente"
  | "mais-antigo"
  | "nome-az"
  | "nome-za"
  | "menor-quantidade"
  | "maior-quantidade"
  | "estoque-baixo"
  | "categoria"
  | "unidade"
  | "maior-custo"
  | "menor-custo";

const texto = (valor?: string) => (valor?.localeCompare ? valor : "");

const porTexto = (a?: string, b?: string) => texto(a).localeCompare(texto(b), "pt-BR");

const porCriacao = (a?: string, b?: string) => porTexto(a, b);

const completudeCliente = (cliente: Cliente) =>
  [
    cliente.nome,
    cliente.celular,
    cliente.cpf,
    cliente.dataNascimento,
    cliente.cep,
    cliente.rua,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
  ].filter(Boolean).length;

const proximoAniversario = (data?: string) => {
  if (!data) return Number.POSITIVE_INFINITY;
  const [, mes, dia] = data.split("-").map(Number);
  if (!mes || !dia) return Number.POSITIVE_INFINITY;
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const esteAno = new Date(anoAtual, mes - 1, dia).getTime();
  const referencia = new Date(anoAtual, hoje.getMonth(), hoje.getDate()).getTime();
  return esteAno >= referencia ? esteAno : new Date(anoAtual + 1, mes - 1, dia).getTime();
};

const pesoEstoque = (item: Pick<Produto | InsumoEstoque, "quantidade" | "estoqueMinimo">) => {
  const status = statusEstoque(item.quantidade, item.estoqueMinimo);
  if (status === "esgotado") return 0;
  if (status === "baixo") return 1;
  return 2;
};

export function ordenarVendas(vendas: Venda[], ordenacao: OrdenacaoVendas) {
  return [...vendas].sort((a, b) => {
    if (ordenacao === "mais-antigo") return porTexto(a.data, b.data);
    if (ordenacao === "cliente-az")
      return porTexto(a.cliente, b.cliente) || porTexto(b.data, a.data);
    if (ordenacao === "produto-az") {
      return porTexto(a.itens[0]?.produtoNome, b.itens[0]?.produtoNome) || porTexto(b.data, a.data);
    }
    if (ordenacao === "maior-valor") return totalVenda(b) - totalVenda(a);
    if (ordenacao === "menor-valor") return totalVenda(a) - totalVenda(b);
    if (ordenacao === "pendente-primeiro") {
      return (
        Number(statusPagamentoVenda(a) === "pago") - Number(statusPagamentoVenda(b) === "pago")
      );
    }
    if (ordenacao === "pago-primeiro") {
      return (
        Number(statusPagamentoVenda(b) === "pago") - Number(statusPagamentoVenda(a) === "pago")
      );
    }
    return porTexto(b.data, a.data);
  });
}

export function ordenarClientes(clientes: Cliente[], ordenacao: OrdenacaoClientes) {
  return [...clientes].sort((a, b) => {
    if (ordenacao === "mais-antigo") return porCriacao(a.createdAt, b.createdAt);
    if (ordenacao === "nome-az") return porTexto(a.nome, b.nome);
    if (ordenacao === "nome-za") return porTexto(b.nome, a.nome);
    if (ordenacao === "completo-primeiro") {
      return completudeCliente(b) - completudeCliente(a) || porTexto(a.nome, b.nome);
    }
    if (ordenacao === "aniversario") {
      return proximoAniversario(a.dataNascimento) - proximoAniversario(b.dataNascimento);
    }
    return porCriacao(b.createdAt, a.createdAt) || porTexto(a.nome, b.nome);
  });
}

export function ordenarProdutos(produtos: Produto[], ordenacao: OrdenacaoProdutos) {
  return [...produtos].sort((a, b) => {
    if (ordenacao === "mais-antigo") return porCriacao(a.createdAt, b.createdAt);
    if (ordenacao === "nome-az") return porTexto(a.nome, b.nome);
    if (ordenacao === "nome-za") return porTexto(b.nome, a.nome);
    if (ordenacao === "maior-estoque") return b.quantidade - a.quantidade;
    if (ordenacao === "menor-estoque") return a.quantidade - b.quantidade;
    if (ordenacao === "estoque-baixo")
      return pesoEstoque(a) - pesoEstoque(b) || a.quantidade - b.quantidade;
    if (ordenacao === "maior-valor") return b.valorVenda - a.valorVenda;
    if (ordenacao === "menor-valor") return a.valorVenda - b.valorVenda;
    if (ordenacao === "tipo") return porTexto(a.categoria, b.categoria) || porTexto(a.nome, b.nome);
    if (ordenacao === "essencia")
      return porTexto(a.essencia, b.essencia) || porTexto(a.nome, b.nome);
    return porCriacao(b.createdAt, a.createdAt) || porTexto(a.nome, b.nome);
  });
}

export function ordenarEstoque(insumos: InsumoEstoque[], ordenacao: OrdenacaoEstoque) {
  return [...insumos].sort((a, b) => {
    if (ordenacao === "mais-antigo") return porCriacao(a.createdAt, b.createdAt);
    if (ordenacao === "nome-az") return porTexto(a.nome, b.nome);
    if (ordenacao === "nome-za") return porTexto(b.nome, a.nome);
    if (ordenacao === "menor-quantidade") return a.quantidade - b.quantidade;
    if (ordenacao === "maior-quantidade") return b.quantidade - a.quantidade;
    if (ordenacao === "estoque-baixo")
      return pesoEstoque(a) - pesoEstoque(b) || a.quantidade - b.quantidade;
    if (ordenacao === "categoria")
      return porTexto(a.categoria, b.categoria) || porTexto(a.nome, b.nome);
    if (ordenacao === "unidade") return porTexto(a.unidade, b.unidade) || porTexto(a.nome, b.nome);
    if (ordenacao === "maior-custo") return b.custoUnitario - a.custoUnitario;
    if (ordenacao === "menor-custo") return a.custoUnitario - b.custoUnitario;
    return porCriacao(b.createdAt, a.createdAt) || porTexto(a.nome, b.nome);
  });
}
