import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Field, FormGrid, SelectInput, TextArea, TextInput } from "@/components/form-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Panel, StatCard } from "@/components/ui-kit";
import { brl, dataBR, hojeISO, num, type ItemProducao, type Produto } from "@/lib/domain";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/producao")({
  head: () => ({ meta: [{ title: "Produção - Lavandine" }] }),
  component: ProducaoPage,
});

type ItemForm = {
  insumoId: string;
  quantidade: string;
};

const itemVazio = { insumoId: "", quantidade: "" };

function ProducaoPage() {
  const { producoes, produtos, insumos, salvarProducao } = useStore();
  const [aberto, setAberto] = useState(false);
  const [produtoId, setProdutoId] = useState("");
  const [data, setData] = useState(hojeISO());
  const [quantidade, setQuantidade] = useState("1");
  const [itens, setItens] = useState<ItemForm[]>([{ ...itemVazio }]);
  const [observacoes, setObservacoes] = useState("");

  const produtoSelecionado = produtos.find((produto) => produto.id === produtoId);

  const itensPreenchidos = useMemo(
    () =>
      itens
        .map((item) => {
          const insumo = insumos.find((registro) => registro.id === item.insumoId);
          const quantidadeUsada = Number(item.quantidade) || 0;
          return { insumo, quantidadeUsada };
        })
        .filter((item) => item.insumo && item.quantidadeUsada > 0),
    [insumos, itens],
  );

  const custoPrevisto = itensPreenchidos.reduce(
    (soma, item) => soma + item.quantidadeUsada * (item.insumo?.custoUnitario ?? 0),
    0,
  );
  const alertas = itensPreenchidos.filter(
    (item) => item.insumo && item.quantidadeUsada > item.insumo.quantidade,
  );
  const totalProduzido = producoes.reduce((soma, item) => soma + item.quantidadeProduzida, 0);

  function abrirNova() {
    const primeiroProduto = produtos.find((produto) => produto.categoria !== "Kits");
    const primeiroInsumo = insumos[0];
    setProdutoId(primeiroProduto?.id ?? "");
    setData(hojeISO());
    setQuantidade("1");
    setItens([{ insumoId: primeiroInsumo?.id ?? "", quantidade: "" }]);
    setObservacoes("");
    setAberto(true);
  }

  function alterarItem(indice: number, item: Partial<ItemForm>) {
    setItens((atuais) =>
      atuais.map((atual, posicao) => (posicao === indice ? { ...atual, ...item } : atual)),
    );
  }

  function adicionarItem() {
    setItens((atuais) => [...atuais, { ...itemVazio }]);
  }

  function removerItem(indice: number) {
    setItens((atuais) => atuais.filter((_, posicao) => posicao !== indice));
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoSelecionado) {
      toast.error("Selecione um produto.");
      return;
    }
    if ((Number(quantidade) || 0) <= 0) {
      toast.error("Informe a quantidade produzida.");
      return;
    }
    if (itensPreenchidos.length === 0) {
      toast.error("Informe pelo menos uma matéria-prima usada.");
      return;
    }
    if (alertas.length > 0) {
      toast.error("Há matéria-prima sem saldo suficiente.");
      return;
    }

    const itensProducao: ItemProducao[] = itensPreenchidos.map((item) => ({
      insumoId: item.insumo!.id,
      insumoNome: item.insumo!.nome,
      quantidade: item.quantidadeUsada,
      unidade: item.insumo!.unidade,
    }));

    const salvou = await salvarProducao({
      data,
      produtoId: produtoSelecionado.id,
      produtoNome: produtoSelecionado.nome,
      categoria: produtoSelecionado.categoria,
      essencia: produtoSelecionado.essencia,
      quantidadeProduzida: Number(quantidade) || 0,
      itens: itensProducao,
      ...(observacoes.trim() ? { observacoes: observacoes.trim() } : {}),
    });
    if (!salvou) return;
    setAberto(false);
    toast.success("Produção registrada.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Produção"
        subtitle="Transforma matéria-prima em produto pronto"
        action={
          <Button onClick={abrirNova} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova produção</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Produções" value={String(producoes.length)} />
        <StatCard label="Unidades produzidas" value={num(totalProduzido)} />
        <StatCard
          label="Última produção"
          value={producoes[0] ? dataBR(producoes[0].data) : "-"}
          {...(producoes[0] ? { hint: producoes[0].produtoNome } : {})}
        />
        <StatCard label="Produtos ativos" value={String(produtos.length)} />
      </div>

      <Panel title="Histórico de produção" className="mt-4">
        {producoes.length === 0 ? (
          <EmptyState>Nenhuma produção registrada ainda.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {producoes.map((producao) => (
              <li key={producao.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {producao.produtoNome} · {producao.essencia}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dataBR(producao.data)} · {num(producao.quantidadeProduzida)} un.
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                    {producao.itens.length} insumos
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {producao.itens
                    .map((item) => `${item.insumoNome}: ${num(item.quantidade)} ${item.unidade}`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova produção</DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              <Field label="Data">
                <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </Field>
              <Field label="Produto pronto">
                <SelectInput value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                  {produtos
                    .filter((produto) => produto.categoria !== "Kits")
                    .map((produto: Produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} · {produto.essencia}
                      </option>
                    ))}
                </SelectInput>
              </Field>
              <Field label="Quantidade produzida">
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </Field>
            </FormGrid>

            <Panel title="Matérias-primas usadas">
              <div className="space-y-3">
                {itens.map((item, indice) => {
                  const insumo = insumos.find((registro) => registro.id === item.insumoId);
                  const quantidadeUsada = Number(item.quantidade) || 0;
                  const semSaldo = insumo ? quantidadeUsada > insumo.quantidade : false;

                  return (
                    <div
                      key={indice}
                      className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_150px_auto]"
                    >
                      <Field label="Item">
                        <SelectInput
                          value={item.insumoId}
                          onChange={(e) => alterarItem(indice, { insumoId: e.target.value })}
                        >
                          <option value="">Selecione</option>
                          {insumos.map((insumoItem) => (
                            <option key={insumoItem.id} value={insumoItem.id}>
                              {insumoItem.nome} · saldo {num(insumoItem.quantidade)}{" "}
                              {insumoItem.unidade}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>
                      <Field label="Quantidade">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantidade}
                          onChange={(e) => alterarItem(indice, { quantidade: e.target.value })}
                        />
                      </Field>
                      <div className="flex items-end justify-between gap-2">
                        <span
                          className={
                            semSaldo ? "text-xs text-destructive" : "text-xs text-muted-foreground"
                          }
                        >
                          {insumo
                            ? `${insumo.unidade} · ${brl(quantidadeUsada * insumo.custoUnitario)}`
                            : ""}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover matéria-prima"
                          onClick={() => removerItem(indice)}
                          disabled={itens.length === 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={adicionarItem}
              >
                <Plus className="size-4" />
                Adicionar matéria-prima
              </Button>
            </Panel>

            <Field label="Observações">
              <TextArea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </Field>

            <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
              Custo previsto: <strong>{brl(custoPrevisto)}</strong>
              {Number(quantidade) > 0 ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {brl(custoPrevisto / Number(quantidade))} por unidade
                </span>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar produção</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
