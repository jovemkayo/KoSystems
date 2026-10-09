import type { Cliente, Compra, InsumoEstoque, Produto, Venda } from "./domain";
const today = new Date().toISOString().slice(0, 10);
export const clientesIniciais: Cliente[] = [
  { id: "demo-cliente1", nome: "Cliente de exemplo A", celular: "11000000001" },
  { id: "demo-cliente2", nome: "Cliente de exemplo B", celular: "11000000002" },
];
export const insumosIniciais: InsumoEstoque[] = [
  { id: "demo-insumo1", nome: "Essência de Lavanda", categoria: "Essência", quantidade: 500, unidade: "ml", custoUnitario: 0.2, estoqueMinimo: 100 },
  { id: "demo-insumo2", nome: "Base para Body Splash", categoria: "Base", quantidade: 10, unidade: "litro", custoUnitario: 25, estoqueMinimo: 2 },
  { id: "demo-insumo3", nome: "Frasco 250 ml", categoria: "Frasco", quantidade: 60, unidade: "unidade", custoUnitario: 4, estoqueMinimo: 10 },
  { id: "demo-insumo4", nome: "Base Glicerinada", categoria: "Base", quantidade: 1, unidade: "kg", custoUnitario: 20, estoqueMinimo: 2 },
];
export const comprasIniciais: Compra[] = insumosIniciais.map((item, i) => ({ id: `demo-compra${i}`, item: item.nome, categoria: item.categoria, quantidade: item.quantidade, unidade: item.unidade, valorUnitario: item.custoUnitario, data: today, fornecedor: "Fornecedor fictício", observacoes: "Compra de demonstração" }));
export const produtosIniciais: Produto[] = [
  { id: "demo-produto1", nome: "Body Splash", categoria: "Corpo", essencia: "Lavanda", medidaValor: 250, medidaUnidade: "ml", quantidade: 24, valorVenda: 40, custoEstimado: 12, estoqueMinimo: 5 },
  { id: "demo-produto2", nome: "Sabonete Artesanal", categoria: "Corpo", essencia: "Lavanda", medidaValor: 100, medidaUnidade: "g", quantidade: 4, valorVenda: 18, custoEstimado: 5, estoqueMinimo: 5 },
  { id: "demo-produto3", nome: "Aromatizador", categoria: "Ambiente", essencia: "Baunilha", medidaValor: 200, medidaUnidade: "ml", quantidade: 12, valorVenda: 35, custoEstimado: 10, estoqueMinimo: 3 },
];
export const vendasIniciais: Venda[] = [
  { id: "demo-venda1", data: today, clienteId: "demo-cliente1", cliente: "Cliente de exemplo A", formaPagamento: "Pix", frete: 0, itens: [{ produtoId: "demo-produto1", produtoNome: "Body Splash", categoria: "Corpo", essencia: "Lavanda", medidaValor: 250, medidaUnidade: "ml", quantidade: 2, valorUnitario: 40, desconto: 0 }], pagamentos: [{ id: "demo-pagamento1", data: today, valor: 80, pago: true }] },
  { id: "demo-venda2", data: today, clienteId: "demo-cliente2", cliente: "Cliente de exemplo B", formaPagamento: "Dinheiro", frete: 0, itens: [{ produtoId: "demo-produto3", produtoNome: "Aromatizador", categoria: "Ambiente", essencia: "Baunilha", medidaValor: 200, medidaUnidade: "ml", quantidade: 1, valorUnitario: 35, desconto: 0 }], pagamentos: [{ id: "demo-pagamento2", data: today, valor: 35, pago: false }] },
];
