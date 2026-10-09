import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { BarList, EmptyState, Panel, StatCard } from "@/components/ui-kit";
import { Field, FormGrid, SelectInput, TextArea, TextInput } from "@/components/form-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORIAS_INSUMO,
  UNIDADES,
  brl,
  dataBR,
  hojeISO,
  num,
  type CategoriaInsumo,
  type Compra,
  type Unidade,
} from "@/lib/domain";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/compras")({
  head: () => ({
    meta: [
      { title: "Compras de matéria-prima - Lavandine" },
      {
        name: "description",
        content: "Registro de compras de insumos com filtros por data, categoria e total gasto.",
      },
      { property: "og:title", content: "Compras de matéria-prima - Lavandine" },
      {
        property: "og:description",
        content: "Registro de compras de insumos com filtros por data, categoria e total gasto.",
      },
    ],
  }),
  component: ComprasPage,
});

const vazio = {
  item: "",
  categoria: "Essência" as CategoriaInsumo,
  quantidade: "",
  unidade: "ml" as Unidade,
  valorUnitario: "",
  data: hojeISO(),
  fornecedor: "",
  observacoes: "",
};

function ComprasPage() {
  const { compras, salvarCompra, removerCompra } = useStore();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Compra | null>(null);
  const [form, setForm] = useState({ ...vazio });

  const filtradas = useMemo(
    () =>
      compras
        .filter((c) => (de ? c.data >= de : true))
        .filter((c) => (ate ? c.data <= ate : true))
        .filter((c) => (categoria === "todas" ? true : c.categoria === categoria))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [compras, de, ate, categoria],
  );

  const total = filtradas.reduce((s, c) => s + c.quantidade * c.valorUnitario, 0);

  const porCategoria = Object.values(
    filtradas.reduce<Record<string, { label: string; value: number }>>((acc, c) => {
      acc[c.categoria] = {
        label: c.categoria,
        value: (acc[c.categoria]?.value ?? 0) + c.quantidade * c.valorUnitario,
      };
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  function abrirNova() {
    setEditando(null);
    setForm({ ...vazio, data: hojeISO() });
    setAberto(true);
  }

  function abrirEdicao(compra: Compra) {
    setEditando(compra);
    setForm({
      item: compra.item,
      categoria: compra.categoria,
      quantidade: String(compra.quantidade),
      unidade: compra.unidade,
      valorUnitario: String(compra.valorUnitario),
      data: compra.data,
      fornecedor: compra.fornecedor ?? "",
      observacoes: compra.observacoes ?? "",
    });
    setAberto(true);
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.item.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    const compra: Omit<Compra, "id"> & { id?: string } = {
      item: form.item.trim(),
      categoria: form.categoria,
      quantidade: Number(form.quantidade) || 0,
      unidade: form.unidade,
      valorUnitario: Number(form.valorUnitario) || 0,
      data: form.data,
    };
    if (editando) compra.id = editando.id;
    if (form.fornecedor.trim()) compra.fornecedor = form.fornecedor.trim();
    if (form.observacoes.trim()) compra.observacoes = form.observacoes.trim();
    const salvou = await salvarCompra(compra);
    if (!salvou) return;
    setAberto(false);
    toast.success(editando ? "Compra atualizada." : "Compra registrada.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Compras"
        subtitle="Matéria-prima e insumos"
        action={
          <Button onClick={abrirNova} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova compra</span>
          </Button>
        }
      />

      <Panel title="Filtros" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="De">
            <TextInput type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </Field>
          <Field label="Até">
            <TextInput type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="todas">Todas</option>
              {CATEGORIAS_INSUMO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total no período"
          value={brl(total)}
          hint={`${filtradas.length} compras`}
        />
        <StatCard
          label="Itens comprados"
          value={num(filtradas.reduce((s, c) => s + c.quantidade, 0))}
          hint="Somatório das quantidades"
        />
        <StatCard
          label="Ticket médio"
          value={brl(filtradas.length ? total / filtradas.length : 0)}
        />
        <StatCard label="Categorias" value={String(porCategoria.length)} hint="No período" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel title="Lista de compras">
          {filtradas.length === 0 ? (
            <EmptyState>Nenhuma compra encontrada com estes filtros.</EmptyState>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Item</th>
                      <th className="py-2 pr-3 font-medium">Categoria</th>
                      <th className="py-2 pr-3 font-medium">Qtd.</th>
                      <th className="py-2 pr-3 font-medium">Unitário</th>
                      <th className="py-2 pr-3 font-medium">Total</th>
                      <th className="py-2 pr-3 font-medium">Data</th>
                      <th className="py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((c) => (
                      <tr key={c.id} className="border-b border-border/70 last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-medium">{c.item}</p>
                          {c.fornecedor ? (
                            <p className="text-xs text-muted-foreground">{c.fornecedor}</p>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{c.categoria}</td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {num(c.quantidade)} {c.unidade}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">{brl(c.valorUnitario)}</td>
                        <td className="py-2.5 pr-3 font-medium tabular-nums">
                          {brl(c.quantidade * c.valorUnitario)}
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{dataBR(c.data)}</td>
                        <td className="py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEdicao(c)}
                              aria-label="Editar compra"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Excluir compra"
                              onClick={() => {
                                removerCompra(c.id);
                                toast.success("Compra excluída.");
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 md:hidden">
                {filtradas.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.item}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.categoria} · {dataBR(c.data)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {brl(c.quantidade * c.valorUnitario)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {num(c.quantidade)} {c.unidade} × {brl(c.valorUnitario)}
                      </p>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(c)}
                          aria-label="Editar compra"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir compra"
                          onClick={() => {
                            removerCompra(c.id);
                            toast.success("Compra excluída.");
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel title="Gasto por categoria">
          <BarList items={porCategoria} formatar={brl} />
        </Panel>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar compra" : "Nova compra"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              <Field label="Nome do item" className="sm:col-span-2">
                <TextInput
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  placeholder="Essência de morango"
                />
              </Field>
              <Field label="Categoria">
                <SelectInput
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value as CategoriaInsumo })
                  }
                >
                  {CATEGORIAS_INSUMO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Unidade de medida">
                <SelectInput
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value as Unidade })}
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Quantidade">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </Field>
              <Field label="Valor unitário (R$)">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.valorUnitario}
                  onChange={(e) => setForm({ ...form, valorUnitario: e.target.value })}
                />
              </Field>
              <Field label="Data da compra">
                <TextInput
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </Field>
              <Field label="Fornecedor (opcional)">
                <TextInput
                  value={form.fornecedor}
                  onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                />
              </Field>
              <Field label="Observações" className="sm:col-span-2">
                <TextArea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </Field>
            </FormGrid>
            <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
              Valor total:{" "}
              <strong className="tabular-nums">
                {brl((Number(form.quantidade) || 0) * (Number(form.valorUnitario) || 0))}
              </strong>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
