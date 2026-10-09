import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Field, FormGrid, SelectInput, TextInput } from "@/components/form-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Panel, StatCard, StatusBadge } from "@/components/ui-kit";
import {
  CATEGORIAS_INSUMO,
  UNIDADES,
  brl,
  num,
  statusEstoque,
  type CategoriaInsumo,
  type InsumoEstoque,
  type Unidade,
} from "@/lib/domain";
import { ordenarEstoque, type OrdenacaoEstoque } from "@/lib/ordenacao";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [{ title: "Estoque de matéria-prima - Lavandine" }],
  }),
  component: EstoquePage,
});

const inicial = {
  nome: "",
  categoria: "Essência" as CategoriaInsumo,
  quantidade: "",
  unidade: "ml" as Unidade,
  custoUnitario: "",
  estoqueMinimo: "",
};

function EstoquePage() {
  const { insumos, salvarInsumo, ajustarInsumo, removerInsumo } = useStore();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [ordenar, setOrdenar] = useState<OrdenacaoEstoque>("mais-recente");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<InsumoEstoque | null>(null);
  const [form, setForm] = useState({ ...inicial });

  const filtrados = useMemo(
    () =>
      ordenarEstoque(
        insumos
          .filter((item) => item.nome.toLowerCase().includes(busca.toLowerCase()))
          .filter((item) => (categoria === "todas" ? true : item.categoria === categoria))
          .filter((item) =>
            status === "todos"
              ? true
              : statusEstoque(item.quantidade, item.estoqueMinimo) === status,
          ),
        ordenar,
      ),
    [busca, categoria, insumos, ordenar, status],
  );

  const valorTotal = filtrados.reduce((s, item) => s + item.quantidade * item.custoUnitario, 0);
  const baixos = insumos.filter(
    (item) => statusEstoque(item.quantidade, item.estoqueMinimo) !== "normal",
  );

  function abrirNovo() {
    setEditando(null);
    setForm({ ...inicial });
    setAberto(true);
  }

  function abrirEdicao(item: InsumoEstoque) {
    setEditando(item);
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      quantidade: String(item.quantidade),
      unidade: item.unidade,
      custoUnitario: String(item.custoUnitario),
      estoqueMinimo: String(item.estoqueMinimo),
    });
    setAberto(true);
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    const salvou = await salvarInsumo({
      ...(editando ? { id: editando.id } : {}),
      nome: form.nome.trim(),
      categoria: form.categoria,
      quantidade: Number(form.quantidade) || 0,
      unidade: form.unidade,
      custoUnitario: Number(form.custoUnitario) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
    });
    if (!salvou) return;
    setAberto(false);
    toast.success(editando ? "Item atualizado." : "Item adicionado.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Estoque"
        subtitle="Matéria-prima e insumos"
        action={
          <Button onClick={abrirNovo} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo item</span>
          </Button>
        }
      />

      <Panel title="Filtros" className="mb-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <Field label="Buscar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <TextInput
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Categoria">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="todas">Todas</option>
              {CATEGORIAS_INSUMO.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="normal">Normal</option>
              <option value="baixo">Baixo</option>
              <option value="esgotado">Esgotado</option>
            </SelectInput>
          </Field>
          <Field label="Ordenar">
            <SelectInput
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as OrdenacaoEstoque)}
            >
              <option value="mais-recente">Mais recente</option>
              <option value="mais-antigo">Mais antigo</option>
              <option value="nome-az">Item A-Z</option>
              <option value="nome-za">Item Z-A</option>
              <option value="menor-quantidade">Menor quantidade</option>
              <option value="maior-quantidade">Maior quantidade</option>
              <option value="estoque-baixo">Estoque baixo primeiro</option>
              <option value="categoria">Categoria</option>
              <option value="unidade">Unidade</option>
              <option value="maior-custo">Maior custo unitário</option>
              <option value="menor-custo">Menor custo unitário</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Itens" value={String(filtrados.length)} hint="Filtrados" />
        <StatCard label="Valor em estoque" value={brl(valorTotal)} />
        <StatCard
          label="Estoque baixo"
          value={String(baixos.length)}
          tone={baixos.length ? "warning" : "positive"}
        />
        <StatCard
          label="Categorias"
          value={String(new Set(insumos.map((item) => item.categoria)).size)}
        />
      </div>

      <Panel title="Itens de matéria-prima" className="mt-4">
        {filtrados.length === 0 ? (
          <EmptyState>Nenhum item encontrado.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {filtrados.map((item) => (
              <li
                key={item.id}
                className="grid gap-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.nome}</p>
                    <StatusBadge quantidade={item.quantidade} minimo={item.estoqueMinimo} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.categoria} · {num(item.quantidade)} {item.unidade} · mín.{" "}
                    {num(item.estoqueMinimo)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Custo unitário {brl(item.custoUnitario)} · total{" "}
                    {brl(item.quantidade * item.custoUnitario)}
                  </p>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Dar baixa"
                    onClick={() => ajustarInsumo(item.id, -1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Dar entrada"
                    onClick={() => ajustarInsumo(item.id, 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar item"
                    onClick={() => abrirEdicao(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir item"
                    onClick={() => removerInsumo(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              <Field label="Nome" className="sm:col-span-2">
                <TextInput
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </Field>
              <Field label="Categoria">
                <SelectInput
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value as CategoriaInsumo })
                  }
                >
                  {CATEGORIAS_INSUMO.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Unidade">
                <SelectInput
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value as Unidade })}
                >
                  {UNIDADES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Quantidade">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </Field>
              <Field label="Custo unitário">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.custoUnitario}
                  onChange={(e) => setForm({ ...form, custoUnitario: e.target.value })}
                />
              </Field>
              <Field label="Estoque mínimo">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.estoqueMinimo}
                  onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                />
              </Field>
            </FormGrid>
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
