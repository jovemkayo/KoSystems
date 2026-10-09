import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BarList, Panel, StatCard } from "@/components/ui-kit";
import { brl, num, statusEstoque, totalVenda } from "@/lib/domain";
import { somarPor } from "@/lib/metricas";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios - Lavandine" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { compras, insumos, produtos, vendas } = useStore();

  const totalCompras = compras.reduce((s, item) => s + item.quantidade * item.valorUnitario, 0);
  const itensVendidos = vendas.flatMap((venda) => venda.itens);
  const totalVendas = vendas.reduce((s, item) => s + totalVenda(item), 0);
  const custoProdutos = produtos.reduce((s, item) => s + item.quantidade * item.custoEstimado, 0);
  const valorProdutos = produtos.reduce((s, item) => s + item.quantidade * item.valorVenda, 0);
  const itensBaixos = [
    ...insumos.filter((item) => statusEstoque(item.quantidade, item.estoqueMinimo) !== "normal"),
    ...produtos.filter((item) => statusEstoque(item.quantidade, item.estoqueMinimo) !== "normal"),
  ];

  const comprasPorCategoria = somarPor(
    compras,
    (item) => item.categoria,
    (item) => item.quantidade * item.valorUnitario,
  );
  const vendasPorPagamento = somarPor(vendas, (item) => item.formaPagamento, totalVenda);
  const vendasPorCategoria = somarPor(
    itensVendidos,
    (item) => item.categoria,
    (item) => item.quantidade,
  );
  const vendasPorEssencia = somarPor(
    itensVendidos,
    (item) => item.essencia,
    (item) => item.quantidade,
  );
  const produtosMaisVendidos = somarPor(
    itensVendidos,
    (item) => `${item.produtoNome} · ${item.essencia}`,
    (item) => item.quantidade,
  ).slice(0, 8);

  return (
    <AppShell>
      <PageHeader title="Relatórios" subtitle="Resumo simples do ateliê" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Compras" value={brl(totalCompras)} />
        <StatCard label="Vendas" value={brl(totalVendas)} tone="positive" />
        <StatCard
          label="Saldo"
          value={brl(totalVendas - totalCompras)}
          tone={totalVendas >= totalCompras ? "positive" : "negative"}
        />
        <StatCard
          label="Estoque baixo"
          value={String(itensBaixos.length)}
          tone={itensBaixos.length ? "warning" : "positive"}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <StatCard
          label="Valor em produtos"
          value={brl(valorProdutos)}
          hint="Preço de venda em estoque"
        />
        <StatCard
          label="Custo em produtos"
          value={brl(custoProdutos)}
          hint="Custo estimado em estoque"
        />
        <StatCard
          label="Margem em estoque"
          value={brl(valorProdutos - custoProdutos)}
          hint="Venda prevista menos custo"
          tone="positive"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Produtos mais vendidos">
          <BarList items={produtosMaisVendidos} formatar={(valor) => `${num(valor)} un.`} />
        </Panel>
        <Panel title="Vendas por forma de pagamento">
          <BarList items={vendasPorPagamento} formatar={brl} />
        </Panel>
        <Panel title="Vendas por tipo">
          <BarList items={vendasPorCategoria} formatar={(valor) => `${num(valor)} un.`} />
        </Panel>
        <Panel title="Vendas por essência">
          <BarList items={vendasPorEssencia} formatar={(valor) => `${num(valor)} un.`} />
        </Panel>
        <Panel title="Compras por categoria" className="lg:col-span-2">
          <BarList items={comprasPorCategoria} formatar={brl} />
        </Panel>
      </div>
    </AppShell>
  );
}
