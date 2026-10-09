export type Unidade = "ml" | "litro" | "g" | "kg" | "unidade";

export const UNIDADES: Unidade[] = ["ml", "litro", "g", "kg", "unidade"];

export const CATEGORIAS_INSUMO = [
  "Essência",
  "Frasco",
  "Embalagem",
  "Base",
  "Óleo",
  "Manteiga",
  "Corante",
  "Etiqueta",
  "Outros",
] as const;
export type CategoriaInsumo = (typeof CATEGORIAS_INSUMO)[number];

export const CATEGORIAS_PRODUTO = ["Corpo", "Ambiente", "Rosto", "Kits"] as const;
export type CategoriaProduto = (typeof CATEGORIAS_PRODUTO)[number];

export const normalizarCategoriaProduto = (categoria: string): CategoriaProduto =>
  (categoria === "Casa/Ambiente" ? "Ambiente" : categoria) as CategoriaProduto;

export type ItemKit = {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
};

export const FORMAS_PAGAMENTO = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Outros",
] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export type Compra = {
  id: string;
  item: string;
  categoria: CategoriaInsumo;
  quantidade: number;
  unidade: Unidade;
  valorUnitario: number;
  data: string;
  fornecedor?: string;
  observacoes?: string;
};

export type InsumoEstoque = {
  id: string;
  nome: string;
  categoria: CategoriaInsumo;
  quantidade: number;
  unidade: Unidade;
  custoUnitario: number;
  estoqueMinimo: number;
  createdAt?: string;
};

export type Produto = {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  essencia: string;
  medidaValor: number;
  medidaUnidade: Unidade;
  quantidade: number;
  valorVenda: number;
  custoEstimado: number;
  estoqueMinimo: number;
  createdAt?: string;
  kitItens?: ItemKit[];
};

type CadastroProduto = Omit<Produto, "id"> & { id?: string };

export type ValidacaoCadastroProduto =
  | { valido: true; nome: string }
  | { valido: false; motivo: "tipo-parecido"; sugestao: string }
  | { valido: false; motivo: "produto-duplicado"; produtoId: string };

const limparTexto = (valor: string) => valor.trim().replace(/\s+/g, " ");

const compararTexto = (valor: string) =>
  limparTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

const compararTipoProduto = (valor: string) =>
  compararTexto(valor).replace(/\s+\d+(?:[.,]\d+)?\s*(?:ml|g|kg|l|litro|unidades?)$/u, "");

function distanciaEdicao(a: string, b: string) {
  const anterior = Array.from({ length: b.length + 1 }, (_, indice) => indice);

  for (let indiceA = 1; indiceA <= a.length; indiceA += 1) {
    const atual = [indiceA];
    for (let indiceB = 1; indiceB <= b.length; indiceB += 1) {
      atual[indiceB] = Math.min(
        (atual[indiceB - 1] ?? 0) + 1,
        (anterior[indiceB] ?? 0) + 1,
        (anterior[indiceB - 1] ?? 0) + (a[indiceA - 1] === b[indiceB - 1] ? 0 : 1),
      );
    }
    anterior.splice(0, anterior.length, ...atual);
  }

  return anterior[b.length] ?? 0;
}

export function listarTiposProduto(produtos: Produto[]) {
  const tipos = new Map<string, string>();
  for (const produto of produtos) {
    if (produto.categoria === "Kits") continue;
    const nome = limparTexto(produto.nome);
    const chave = compararTexto(nome);
    if (chave && !tipos.has(chave)) tipos.set(chave, nome);
  }
  return Array.from(tipos.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function validarCadastroProduto(
  produtos: Produto[],
  produto: CadastroProduto,
  criandoNovoTipo: boolean,
): ValidacaoCadastroProduto {
  const nome = limparTexto(produto.nome);
  const nomeComparavel = compararTexto(nome);
  const essenciaComparavel = compararTexto(produto.essencia);

  const duplicado = produtos.find(
    (existente) =>
      existente.id !== produto.id &&
      compararTexto(existente.nome) === nomeComparavel &&
      compararTexto(existente.essencia) === essenciaComparavel &&
      compararTexto(existente.categoria) === compararTexto(produto.categoria) &&
      existente.medidaValor === produto.medidaValor &&
      existente.medidaUnidade === produto.medidaUnidade,
  );
  if (duplicado) {
    return { valido: false, motivo: "produto-duplicado", produtoId: duplicado.id };
  }

  if (criandoNovoTipo && produto.categoria !== "Kits") {
    const sugestao = listarTiposProduto(produtos).find((tipo) => {
      const nomeBase = compararTipoProduto(nome);
      const tipoComparavel = compararTipoProduto(tipo);
      const limite = Math.max(
        1,
        Math.floor(Math.max(nomeBase.length, tipoComparavel.length) * 0.2),
      );
      return distanciaEdicao(nomeBase, tipoComparavel) <= limite;
    });
    if (sugestao) return { valido: false, motivo: "tipo-parecido", sugestao };
  }

  return { valido: true, nome };
}

export type ItemVenda = {
  produtoId: string;
  produtoNome: string;
  categoria: CategoriaProduto;
  essencia: string;
  medidaValor: number;
  medidaUnidade: Unidade;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  kitItens?: ItemKit[];
};

export type StatusPagamento = "pago" | "pendente" | "parcial";

export type PagamentoVenda = {
  id: string;
  data: string;
  valor: number;
  pago: boolean;
  observacao?: string;
};

export type Cliente = {
  id: string;
  nome: string;
  celular: string;
  dataNascimento?: string;
  cpf?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  temComplemento?: boolean;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  createdAt?: string;
};

export type Venda = {
  id: string;
  data: string;
  itens: ItemVenda[];
  formaPagamento: FormaPagamento;
  frete: number;
  pagamentos?: PagamentoVenda[];
  clienteId?: string;
  cliente?: string;
  observacoes?: string;
  createdAt?: string;
};

export type ItemProducao = {
  insumoId: string;
  insumoNome: string;
  quantidade: number;
  unidade: Unidade;
};

export type Producao = {
  id: string;
  data: string;
  produtoId: string;
  produtoNome: string;
  categoria: CategoriaProduto;
  essencia: string;
  quantidadeProduzida: number;
  itens: ItemProducao[];
  observacoes?: string;
};

export type StatusEstoque = "esgotado" | "baixo" | "normal";

export function statusEstoque(quantidade: number, minimo: number): StatusEstoque {
  if (quantidade <= 0) return "esgotado";
  if (quantidade <= minimo) return "baixo";
  return "normal";
}

export const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export const dataBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const hojeISO = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

export const novoId = () => crypto.randomUUID();

export const medidaProduto = (produto: Pick<Produto, "medidaValor" | "medidaUnidade">) =>
  produto.medidaValor > 0 ? `${num(produto.medidaValor)} ${produto.medidaUnidade}` : "";

export const totalItemVenda = (
  item: Pick<ItemVenda, "quantidade" | "valorUnitario" | "desconto">,
) => Math.max(0, item.quantidade * item.valorUnitario - item.desconto);

export const totalVenda = (venda: Pick<Venda, "itens" | "frete">) =>
  venda.itens.reduce((soma, item) => soma + totalItemVenda(item), 0) + venda.frete;

export const quantidadeVenda = (venda: Pick<Venda, "itens">) =>
  venda.itens.reduce((soma, item) => soma + item.quantidade, 0);
