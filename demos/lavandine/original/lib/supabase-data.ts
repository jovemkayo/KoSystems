import type {
  CategoriaInsumo,
  Cliente,
  Compra,
  FormaPagamento,
  InsumoEstoque,
  PagamentoVenda,
  ItemProducao,
  ItemVenda,
  Producao,
  Produto,
  Unidade,
  Venda,
} from "./domain";
import { normalizarCategoriaProduto, type ItemKit } from "./domain";

type CompraRow = {
  id: string;
  item: string;
  categoria: string;
  quantidade: number | string;
  unidade: string;
  valor_unitario: number | string;
  data: string;
  fornecedor: string | null;
  observacoes: string | null;
};

type InsumoRow = {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number | string;
  unidade: string;
  custo_unitario: number | string;
  estoque_minimo: number | string;
  created_at?: string | null;
};

type ProdutoRow = {
  id: string;
  nome: string;
  categoria: string;
  essencia: string;
  medida_valor?: number | string | null;
  medida_unidade?: string | null;
  quantidade: number | string;
  valor_venda: number | string;
  custo_estimado: number | string;
  estoque_minimo: number | string;
  created_at?: string | null;
  kit_itens?: ItemKit[] | null;
};

type ClienteRow = {
  id: string;
  nome: string;
  celular: string;
  data_nascimento: string | null;
  cpf: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  tem_complemento: boolean | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  created_at?: string | null;
};

type ProducaoItemRow = {
  id?: string;
  producao_id?: string;
  insumo_id: string;
  insumo_nome: string;
  quantidade: number | string;
  unidade: string;
};

type ProducaoRow = {
  id: string;
  data: string;
  produto_id: string;
  produto_nome: string;
  categoria: string;
  essencia: string;
  quantidade_produzida: number | string;
  observacoes: string | null;
  producao_itens?: ProducaoItemRow[];
};

type VendaRow = {
  id: string;
  data: string;
  produto_id?: string | null;
  produto_nome?: string | null;
  categoria?: string | null;
  essencia?: string | null;
  medida_valor?: number | string | null;
  medida_unidade?: string | null;
  quantidade?: number | string | null;
  valor_unitario?: number | string | null;
  forma_pagamento: string;
  cliente_id?: string | null;
  cliente?: string | null;
  frete?: number | string | null;
  pagamentos?: unknown;
  observacoes: string | null;
  venda_itens?: VendaItemRow[];
  created_at?: string | null;
};

type VendaItemRow = {
  id?: string;
  venda_id?: string;
  produto_id: string;
  produto_nome: string;
  categoria: string;
  essencia: string;
  medida_valor?: number | string | null;
  medida_unidade?: string | null;
  quantidade: number | string;
  valor_unitario: number | string;
  desconto?: number | string | null;
  kit_itens?: ItemKit[] | null;
};

const numero = (valor: number | string) => Number(valor) || 0;

export const compraFromRow = (row: CompraRow): Compra => {
  const compra: Compra = {
    id: row.id,
    item: row.item,
    categoria: row.categoria as CategoriaInsumo,
    quantidade: numero(row.quantidade),
    unidade: row.unidade as Unidade,
    valorUnitario: numero(row.valor_unitario),
    data: row.data,
  };
  if (row.fornecedor) compra.fornecedor = row.fornecedor;
  if (row.observacoes) compra.observacoes = row.observacoes;
  return compra;
};

export const compraToRow = (compra: Compra) => ({
  id: compra.id,
  item: compra.item,
  categoria: compra.categoria,
  quantidade: compra.quantidade,
  unidade: compra.unidade,
  valor_unitario: compra.valorUnitario,
  data: compra.data,
  fornecedor: compra.fornecedor ?? null,
  observacoes: compra.observacoes ?? null,
});

export const insumoFromRow = (row: InsumoRow): InsumoEstoque => ({
  id: row.id,
  nome: row.nome,
  categoria: row.categoria as CategoriaInsumo,
  quantidade: numero(row.quantidade),
  unidade: row.unidade as Unidade,
  custoUnitario: numero(row.custo_unitario),
  estoqueMinimo: numero(row.estoque_minimo),
  ...(row.created_at ? { createdAt: row.created_at } : {}),
});

export const insumoToRow = (insumo: InsumoEstoque) => ({
  id: insumo.id,
  nome: insumo.nome,
  categoria: insumo.categoria,
  quantidade: insumo.quantidade,
  unidade: insumo.unidade,
  custo_unitario: insumo.custoUnitario,
  estoque_minimo: insumo.estoqueMinimo,
});

export const produtoFromRow = (row: ProdutoRow): Produto => ({
  id: row.id,
  nome: row.nome,
  categoria: normalizarCategoriaProduto(row.categoria),
  essencia: row.essencia,
  medidaValor: numero(row.medida_valor ?? 0),
  medidaUnidade: (row.medida_unidade ?? "unidade") as Unidade,
  quantidade: numero(row.quantidade),
  valorVenda: numero(row.valor_venda),
  custoEstimado: numero(row.custo_estimado),
  estoqueMinimo: numero(row.estoque_minimo),
  ...(row.created_at ? { createdAt: row.created_at } : {}),
  ...(row.kit_itens?.length ? { kitItens: row.kit_itens } : {}),
});

export const produtoToRow = (produto: Produto) => ({
  id: produto.id,
  nome: produto.nome,
  categoria: produto.categoria,
  essencia: produto.essencia,
  medida_valor: produto.medidaValor,
  medida_unidade: produto.medidaUnidade,
  quantidade: produto.quantidade,
  valor_venda: produto.valorVenda,
  custo_estimado: produto.custoEstimado,
  estoque_minimo: produto.estoqueMinimo,
  kit_itens: produto.kitItens ?? [],
});

export const clienteFromRow = (row: ClienteRow): Cliente => {
  const cliente: Cliente = {
    id: row.id,
    nome: row.nome,
    celular: row.celular,
  };
  if (row.data_nascimento) cliente.dataNascimento = row.data_nascimento;
  if (row.cpf) cliente.cpf = row.cpf;
  if (row.cep) cliente.cep = row.cep;
  if (row.rua) cliente.rua = row.rua;
  if (row.numero) cliente.numero = row.numero;
  if (row.tem_complemento) cliente.temComplemento = row.tem_complemento;
  if (row.complemento) cliente.complemento = row.complemento;
  if (row.bairro) cliente.bairro = row.bairro;
  if (row.cidade) cliente.cidade = row.cidade;
  if (row.estado) cliente.estado = row.estado;
  if (row.created_at) cliente.createdAt = row.created_at;
  return cliente;
};

export const clienteToRow = (cliente: Cliente) => ({
  id: cliente.id,
  nome: cliente.nome,
  celular: cliente.celular,
  data_nascimento: cliente.dataNascimento ?? null,
  cpf: cliente.cpf ?? null,
  cep: cliente.cep ?? null,
  rua: cliente.rua ?? null,
  numero: cliente.numero ?? null,
  tem_complemento: cliente.temComplemento ?? false,
  complemento: cliente.temComplemento ? (cliente.complemento ?? null) : null,
  bairro: cliente.bairro ?? null,
  cidade: cliente.cidade ?? null,
  estado: cliente.estado ?? null,
});

const producaoItemFromRow = (row: ProducaoItemRow): ItemProducao => ({
  insumoId: row.insumo_id,
  insumoNome: row.insumo_nome,
  quantidade: numero(row.quantidade),
  unidade: row.unidade as Unidade,
});

export const producaoFromRow = (row: ProducaoRow): Producao => {
  const producao: Producao = {
    id: row.id,
    data: row.data,
    produtoId: row.produto_id,
    produtoNome: row.produto_nome,
    categoria: normalizarCategoriaProduto(row.categoria),
    essencia: row.essencia,
    quantidadeProduzida: numero(row.quantidade_produzida),
    itens: (row.producao_itens ?? []).map(producaoItemFromRow),
  };
  if (row.observacoes) producao.observacoes = row.observacoes;
  return producao;
};

export const producaoToRow = (producao: Producao) => ({
  id: producao.id,
  data: producao.data,
  produto_id: producao.produtoId,
  produto_nome: producao.produtoNome,
  categoria: producao.categoria,
  essencia: producao.essencia,
  quantidade_produzida: producao.quantidadeProduzida,
  observacoes: producao.observacoes ?? null,
});

export const producaoItemToRow = (producaoId: string, item: ItemProducao) => ({
  producao_id: producaoId,
  insumo_id: item.insumoId,
  insumo_nome: item.insumoNome,
  quantidade: item.quantidade,
  unidade: item.unidade,
});

const vendaItemFromRow = (row: VendaItemRow): ItemVenda => ({
  produtoId: row.produto_id,
  produtoNome: row.produto_nome,
  categoria: normalizarCategoriaProduto(row.categoria),
  essencia: row.essencia,
  medidaValor: numero(row.medida_valor ?? 0),
  medidaUnidade: (row.medida_unidade ?? "unidade") as Unidade,
  quantidade: numero(row.quantidade),
  valorUnitario: numero(row.valor_unitario),
  desconto: numero(row.desconto ?? 0),
  ...(row.kit_itens?.length ? { kitItens: row.kit_itens } : {}),
});

function pagamentosFromRow(valor: unknown): PagamentoVenda[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const pagamentos = valor
    .map((item): PagamentoVenda | null => {
      if (!item || typeof item !== "object") return null;
      const pagamento = item as Record<string, unknown>;
      if (typeof pagamento["id"] !== "string" || typeof pagamento["data"] !== "string") return null;
      return {
        id: pagamento["id"],
        data: pagamento["data"],
        valor: numero((pagamento["valor"] as number | string | undefined) ?? 0),
        pago: Boolean(pagamento["pago"]),
        ...(typeof pagamento["observacao"] === "string" && pagamento["observacao"].trim()
          ? { observacao: pagamento["observacao"] }
          : {}),
      };
    })
    .filter((item): item is PagamentoVenda => Boolean(item));
  return pagamentos.length ? pagamentos : undefined;
}

export const vendaFromRow = (row: VendaRow): Venda => {
  const itens = row.venda_itens?.length
    ? row.venda_itens.map(vendaItemFromRow)
    : [
        {
          produtoId: row.produto_id ?? "",
          produtoNome: row.produto_nome ?? "",
          categoria: normalizarCategoriaProduto(row.categoria ?? "Corpo"),
          essencia: row.essencia ?? "",
          medidaValor: numero(row.medida_valor ?? 0),
          medidaUnidade: (row.medida_unidade ?? "unidade") as Unidade,
          quantidade: numero(row.quantidade ?? 0),
          valorUnitario: numero(row.valor_unitario ?? 0),
          desconto: 0,
        },
      ];

  const venda: Venda = {
    id: row.id,
    data: row.data,
    itens,
    formaPagamento: row.forma_pagamento as FormaPagamento,
    frete: numero(row.frete ?? 0),
  };
  if (row.created_at) venda.createdAt = row.created_at;
  if (row.cliente_id) venda.clienteId = row.cliente_id;
  if (row.cliente) venda.cliente = row.cliente;
  const pagamentos = pagamentosFromRow(row.pagamentos);
  if (pagamentos) venda.pagamentos = pagamentos;
  if (row.observacoes) venda.observacoes = row.observacoes;
  return venda;
};

export const vendaToRow = (venda: Venda) => ({
  id: venda.id,
  data: venda.data,
  forma_pagamento: venda.formaPagamento,
  cliente_id: venda.clienteId ?? null,
  cliente: venda.cliente ?? null,
  frete: venda.frete,
  pagamentos: venda.pagamentos ?? [],
  observacoes: venda.observacoes ?? null,
});

export const vendaItemToRow = (vendaId: string, item: ItemVenda) => ({
  venda_id: vendaId,
  produto_id: item.produtoId,
  produto_nome: item.produtoNome,
  categoria: item.categoria,
  essencia: item.essencia,
  medida_valor: item.medidaValor,
  medida_unidade: item.medidaUnidade,
  quantidade: item.quantidade,
  valor_unitario: item.valorUnitario,
  desconto: item.desconto,
  kit_itens: item.kitItens ?? [],
});
