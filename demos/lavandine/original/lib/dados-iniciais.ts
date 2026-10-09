import {
  clientesIniciais,
  comprasIniciais,
  insumosIniciais,
  produtosIniciais,
  vendasIniciais,
} from "./mock-data";
import type { Cliente, Compra, InsumoEstoque, Producao, Produto, Venda } from "./domain";

type DadosIniciais = {
  compras: Compra[];
  clientes: Cliente[];
  insumos: InsumoEstoque[];
  producoes: Producao[];
  produtos: Produto[];
  vendas: Venda[];
};

const vazios: DadosIniciais = {
  compras: [],
  clientes: [],
  insumos: [],
  producoes: [],
  produtos: [],
  vendas: [],
};

export function dadosIniciaisDoAplicativo(bancoConfigurado: boolean): DadosIniciais {
  if (bancoConfigurado) return vazios;

  return {
    compras: comprasIniciais,
    clientes: clientesIniciais,
    insumos: insumosIniciais,
    producoes: [],
    produtos: produtosIniciais,
    vendas: vendasIniciais,
  };
}
