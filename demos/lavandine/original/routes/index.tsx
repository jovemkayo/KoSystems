import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  HandCoins,
  PackageSearch,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ClientesACobrarPanel } from "@/components/clientes-a-cobrar-panel";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { BarList, EmptyState, StatCard, StatusBadge } from "@/components/ui-kit";
import {
  brl,
  dataBR,
  hojeISO,
  num,
  quantidadeVenda,
  statusEstoque,
  totalVenda,
} from "@/lib/domain";
import { resumoFinanceiroDashboard } from "@/lib/dashboard-financeiro";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel - Lavandine" },
      {
        name: "description",
        content: "Resumo de compras, vendas, estoque de matéria-prima e produtos prontos.",
      },
      { property: "og:title", content: "Painel - Lavandine" },
      {
        property: "og:description",
        content: "Resumo de compras, vendas, estoque de matéria-prima e produtos prontos.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { clientes, compras, insumos, produtos, vendas } = useStore();

  const totalCompras = compras.reduce((s, c) => s + c.quantidade * c.valorUnitario, 0);
  const financeiro = resumoFinanceiroDashboard(vendas, clientes, hojeISO());
  const totalVendas = financeiro.totalVendido;
  const itensInsumo = insumos.length;
  const produtosEmEstoque = produtos
    .filter((p) => p.categoria !== "Kits")
    .reduce((s, p) => s + p.quantidade, 0);

  const alertasInsumo = insumos.filter(
    (i) => statusEstoque(i.quantidade, i.estoqueMinimo) !== "normal",
  );
  const alertasProduto = produtos.filter(
    (p) => statusEstoque(p.quantidade, p.estoqueMinimo) !== "normal",
  );

  const maisVendidos = Object.values(
    vendas
      .flatMap((venda) => venda.itens)
      .reduce<Record<string, { label: string; value: number }>>((acc, item) => {
        const chave = `${item.produtoNome} · ${item.essencia}`;
        acc[chave] = { label: chave, value: (acc[chave]?.value ?? 0) + item.quantidade };
        return acc;
      }, {}),
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const ultimasVendas = [...vendas].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <AppShell>
      <PageHeader title="Painel" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Compras"
          value={brl(totalCompras)}
          hint={`${compras.length} registros`}
          icon={<ShoppingCart className="size-4" />}
        />
        <StatCard
          label="Vendas"
          value={brl(totalVendas)}
          hint={`${vendas.length} registros`}
          tone="positive"
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          label="Matéria-prima"
          value={`${itensInsumo} itens`}
          hint={
            brl(insumos.reduce((s, i) => s + i.quantidade * i.custoUnitario, 0)) + " em estoque"
          }
          icon={<Boxes className="size-4" />}
        />
        <StatCard
          label="Produtos"
          value={`${num(produtosEmEstoque)} un.`}
          hint={`${produtos.length} variações`}
          icon={<PackageSearch className="size-4" />}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Saldo"
          value={brl(totalVendas - totalCompras)}
          hint="Vendas menos compras"
          tone={totalVendas - totalCompras >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Recebido"
          value={brl(financeiro.totalRecebido)}
          hint="Pagamentos confirmados"
          tone="positive"
          icon={<CircleDollarSign className="size-4" />}
        />
        <StatCard
          label="A receber"
          value={brl(financeiro.totalPendente)}
          hint="Pagamentos pendentes"
          tone={financeiro.totalPendente > 0 ? "warning" : "positive"}
          icon={<HandCoins className="size-4" />}
        />
        <StatCard
          label="Alertas de estoque"
          value={`${alertasInsumo.length + alertasProduto.length}`}
          hint="Itens baixos ou esgotados"
          tone={alertasInsumo.length + alertasProduto.length ? "warning" : "positive"}
          icon={<AlertTriangle className="size-4" />}
        />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <CollapsiblePanel
          title="Estoque baixo"
          action={
            <Link to="/estoque" className="text-xs font-medium text-primary">
              Ver estoque
            </Link>
          }
        >
          {alertasInsumo.length + alertasProduto.length === 0 ? (
            <EmptyState>Nenhum item com estoque baixo.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {[
                ...alertasInsumo.map((i) => ({
                  id: i.id,
                  nome: i.nome,
                  detalhe: `${num(i.quantidade)} ${i.unidade} · mín. ${num(i.estoqueMinimo)}`,
                  quantidade: i.quantidade,
                  minimo: i.estoqueMinimo,
                })),
                ...alertasProduto.map((p) => ({
                  id: p.id,
                  nome: `${p.nome} · ${p.essencia}`,
                  detalhe: `${num(p.quantidade)} un. · mín. ${num(p.estoqueMinimo)}`,
                  quantidade: p.quantidade,
                  minimo: p.estoqueMinimo,
                })),
              ].map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.detalhe}</p>
                  </div>
                  <StatusBadge quantidade={item.quantidade} minimo={item.minimo} />
                </li>
              ))}
            </ul>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Mais vendidos"
          action={
            <Link to="/relatorios" className="text-xs font-medium text-primary">
              Relatórios
            </Link>
          }
        >
          <BarList items={maisVendidos} formatar={(v) => `${num(v)} un.`} />
        </CollapsiblePanel>
      </div>

      <ClientesACobrarPanel
        clientes={financeiro.clientesACobrar}
        className="mt-4"
        action={
          <Link to="/vendas" className="text-xs font-medium text-primary">
            Ver vendas
          </Link>
        }
      />

      <CollapsiblePanel
        title="Últimas vendas"
        className="mt-4"
        action={
          <Link to="/vendas" className="text-xs font-medium text-primary">
            Ver vendas
          </Link>
        }
      >
        {ultimasVendas.length === 0 ? (
          <EmptyState>Nenhuma venda registrada.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {ultimasVendas.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {v.itens.map((item) => item.produtoNome).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dataBR(v.data)} · {quantidadeVenda(v)} un. · {v.formaPagamento}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {brl(totalVenda(v))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CollapsiblePanel>
    </AppShell>
  );
}
