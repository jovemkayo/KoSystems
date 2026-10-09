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
  CATEGORIAS_PRODUTO,
  UNIDADES,
  brl,
  listarTiposProduto,
  medidaProduto,
  num,
  statusEstoque,
  validarCadastroProduto,
  type CategoriaProduto,
  type Produto,
  type ItemKit,
  type Unidade,
} from "@/lib/domain";
import { ordenarProdutos, type OrdenacaoProdutos } from "@/lib/ordenacao";
import { useStore } from "@/lib/store";
import { custoKit, disponibilidadeKit, validarItensKit } from "@/lib/kits";

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos prontos - Lavandine" }] }),
  component: ProdutosPage,
});

const inicial = {
  nome: "",
  categoria: "Corpo" as CategoriaProduto,
  essencia: "",
  medidaValor: "",
  medidaUnidade: "ml" as Unidade,
  quantidade: "",
  valorVenda: "",
  custoEstimado: "",
  estoqueMinimo: "",
};

function ProdutosPage() {
  const { produtos, salvarProduto, ajustarProduto, removerProduto } = useStore();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [essencia, setEssencia] = useState("todas");
  const [ordenar, setOrdenar] = useState<OrdenacaoProdutos>("mais-recente");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [criandoNovoTipo, setCriandoNovoTipo] = useState(false);
  const [form, setForm] = useState({ ...inicial });
  const [kitItens, setKitItens] = useState<ItemKit[]>([]);
  const [produtoKitId, setProdutoKitId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const ehKit = form.categoria === "Kits";
  const produtosParaKit = produtos.filter((produto) => produto.categoria !== "Kits");
  const unidadesKit = disponibilidadeKit(produtos, kitItens);
  const custoDoKit = custoKit(produtos, kitItens);

  const tiposProduto = useMemo(() => listarTiposProduto(produtos), [produtos]);

  const essencias = useMemo(
    () => Array.from(new Set(produtos.map((item) => item.essencia))).sort(),
    [produtos],
  );

  const filtrados = useMemo(
    () =>
      ordenarProdutos(
        produtos
          .filter((item) => item.nome.toLowerCase().includes(busca.toLowerCase()))
          .filter((item) => (categoria === "todas" ? true : item.categoria === categoria))
          .filter((item) => (essencia === "todas" ? true : item.essencia === essencia)),
        ordenar,
      ),
    [busca, categoria, essencia, ordenar, produtos],
  );

  const apenasKits = categoria === "Kits";
  const estoqueFisico = apenasKits
    ? filtrados
    : filtrados.filter((item) => item.categoria !== "Kits");
  const valorEstoque = estoqueFisico.reduce((s, item) => s + item.quantidade * item.valorVenda, 0);
  const lucroPrevisto = estoqueFisico.reduce(
    (s, item) => s + item.quantidade * (item.valorVenda - item.custoEstimado),
    0,
  );
  const baixos = produtos.filter(
    (item) => statusEstoque(item.quantidade, item.estoqueMinimo) !== "normal",
  );

  function abrirNovo(novoKit = false) {
    setEditando(null);
    setCriandoNovoTipo(tiposProduto.length === 0);
    setForm({
      ...inicial,
      nome: novoKit ? "" : (tiposProduto[0] ?? ""),
      categoria: novoKit ? "Kits" : "Corpo",
    });
    setKitItens([]);
    setProdutoKitId("");
    setAberto(true);
  }

  function abrirEdicao(item: Produto) {
    setEditando(item);
    setCriandoNovoTipo(false);
    setKitItens(item.kitItens ?? []);
    setProdutoKitId("");
    setForm({
      nome: item.nome,
      categoria: item.categoria,
      essencia: item.essencia,
      medidaValor: String(item.medidaValor),
      medidaUnidade: item.medidaUnidade,
      quantidade: String(item.quantidade),
      valorVenda: String(item.valorVenda),
      custoEstimado: String(item.custoEstimado),
      estoqueMinimo: String(item.estoqueMinimo),
    });
    setAberto(true);
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || (!ehKit && !form.essencia.trim())) {
      toast.error(ehKit ? "Informe o nome do kit." : "Informe o produto e a essência.");
      return;
    }
    if (ehKit) {
      const erro = validarItensKit(produtos, kitItens, editando?.id);
      if (erro) {
        toast.error(erro);
        return;
      }
    }
    const produto = {
      ...(editando ? { id: editando.id } : {}),
      nome: form.nome.trim(),
      categoria: form.categoria,
      essencia: ehKit ? "" : form.essencia.trim(),
      medidaValor: ehKit ? 0 : Number(form.medidaValor) || 0,
      medidaUnidade: ehKit ? ("unidade" as const) : form.medidaUnidade,
      quantidade: ehKit ? 0 : Number(form.quantidade) || 0,
      valorVenda: Number(form.valorVenda) || 0,
      custoEstimado: ehKit ? custoDoKit : Number(form.custoEstimado) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 0,
      kitItens: ehKit ? kitItens : [],
    };
    const validacao = validarCadastroProduto(produtos, produto, criandoNovoTipo);
    if (!validacao.valido) {
      if (validacao.motivo === "tipo-parecido") {
        setCriandoNovoTipo(false);
        setForm({ ...form, nome: validacao.sugestao });
        toast.error(`Já existe um tipo parecido: “${validacao.sugestao}”. Use essa opção.`);
      } else {
        toast.error(
          "Já existe um produto com o mesmo tipo, essência e tamanho. Edite o existente.",
        );
      }
      return;
    }

    if (salvando) return;
    setSalvando(true);
    let salvou;
    try {
      salvou = await salvarProduto({ ...produto, nome: validacao.nome });
    } finally {
      setSalvando(false);
    }
    if (!salvou) return;
    setAberto(false);
    toast.success(
      editando ? "Produto atualizado." : ehKit ? "Kit adicionado." : "Produto adicionado.",
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Produtos"
        subtitle="Produtos prontos para venda"
        action={
          <div className="flex gap-2">
            <Button onClick={() => abrirNovo(true)} size="sm" variant="outline">
              <Plus className="size-4" />
              Novo kit
            </Button>
            <Button onClick={() => abrirNovo()} size="sm">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Novo produto</span>
            </Button>
          </div>
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
          <Field label="Tipo">
            <SelectInput
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                if (e.target.value === "Kits") setEssencia("todas");
              }}
            >
              <option value="todas">Todas</option>
              {CATEGORIAS_PRODUTO.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Essência">
            <SelectInput value={essencia} onChange={(e) => setEssencia(e.target.value)}>
              <option value="todas">Todas</option>
              {essencias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Ordenar">
            <SelectInput
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as OrdenacaoProdutos)}
            >
              <option value="mais-recente">Mais recente</option>
              <option value="mais-antigo">Mais antigo</option>
              <option value="nome-az">Nome A-Z</option>
              <option value="nome-za">Nome Z-A</option>
              <option value="maior-estoque">Maior estoque</option>
              <option value="menor-estoque">Menor estoque</option>
              <option value="estoque-baixo">Estoque baixo primeiro</option>
              <option value="maior-valor">Maior valor</option>
              <option value="menor-valor">Menor valor</option>
              <option value="tipo">Tipo</option>
              <option value="essencia">Essência A-Z</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Variações" value={String(filtrados.length)} />
        <StatCard
          label={apenasKits ? "Kits disponíveis" : "Unidades"}
          value={num(estoqueFisico.reduce((s, item) => s + item.quantidade, 0))}
        />
        <StatCard
          label={apenasKits ? "Venda potencial dos kits" : "Valor de venda"}
          value={brl(valorEstoque)}
        />
        <StatCard label="Margem prevista" value={brl(lucroPrevisto)} tone="positive" />
      </div>

      <Panel title="Lista de produtos" className="mt-4">
        {filtrados.length === 0 ? (
          <EmptyState>Nenhum produto encontrado.</EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.categoria}
                      {item.essencia ? ` · ${item.essencia}` : ""}
                      {medidaProduto(item) ? ` · ${medidaProduto(item)}` : ""}
                    </p>
                  </div>
                  <StatusBadge quantidade={item.quantidade} minimo={item.estoqueMinimo} />
                </div>
                {item.categoria === "Kits" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(item.kitItens ?? [])
                      .map((componente) => `${componente.quantidade} × ${componente.produtoNome}`)
                      .join(" · ")}
                  </p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="rounded-md bg-secondary px-2 py-1">
                    {item.categoria === "Kits" ? "Disponíveis" : "Qtd."} {num(item.quantidade)}
                  </span>
                  <span className="rounded-md bg-secondary px-2 py-1">{brl(item.valorVenda)}</span>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Dar baixa"
                    disabled={item.categoria === "Kits"}
                    onClick={() => ajustarProduto(item.id, -1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Dar entrada"
                    disabled={item.categoria === "Kits"}
                    onClick={() => ajustarProduto(item.id, 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Editar produto"
                    onClick={() => abrirEdicao(item)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir produto"
                    onClick={() => removerProduto(item.id)}
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
            <DialogTitle>
              {ehKit
                ? editando
                  ? "Editar kit"
                  : "Novo kit"
                : editando
                  ? "Editar produto"
                  : "Novo produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              {ehKit ? (
                <Field label="Nome do kit" className="sm:col-span-2">
                  <TextInput
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex.: Kit Relaxamento"
                  />
                </Field>
              ) : (
                <Field label="Tipo de produto" className="sm:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {criandoNovoTipo ? (
                      <TextInput
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        placeholder="Digite o novo tipo"
                      />
                    ) : (
                      <SelectInput
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      >
                        {tiposProduto.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </SelectInput>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => {
                        const vaiCriar = !criandoNovoTipo;
                        setCriandoNovoTipo(vaiCriar);
                        setForm({ ...form, nome: vaiCriar ? "" : (tiposProduto[0] ?? "") });
                      }}
                    >
                      {criandoNovoTipo ? "Escolher existente" : "Criar novo tipo"}
                    </Button>
                  </div>
                </Field>
              )}
              <Field label="Categoria" className={ehKit ? "sm:col-span-2" : ""}>
                <SelectInput
                  value={form.categoria}
                  disabled={editando?.categoria === "Kits"}
                  onChange={(e) => {
                    const proxima = e.target.value as CategoriaProduto;
                    if ((proxima === "Kits") !== ehKit) {
                      setForm({
                        ...form,
                        categoria: proxima,
                        nome: proxima === "Kits" ? "" : (tiposProduto[0] ?? ""),
                      });
                      setKitItens([]);
                    } else setForm({ ...form, categoria: proxima });
                  }}
                >
                  {CATEGORIAS_PRODUTO.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {ehKit && (
                <div className="space-y-3 rounded-lg border border-border p-3 sm:col-span-2">
                  <p className="font-medium">Produtos do kit</p>
                  <p className="text-sm text-muted-foreground">
                    Escolha os produtos e a quantidade de cada um em um kit. A baixa no estoque
                    acontece somente na venda.
                  </p>
                  <div className="flex items-end gap-2">
                    <Field label="Adicionar produto" className="min-w-0 flex-1">
                      <SelectInput
                        value={produtoKitId}
                        onChange={(e) => setProdutoKitId(e.target.value)}
                      >
                        <option value="">Selecione um produto</option>
                        {produtosParaKit
                          .filter(
                            (produto) => !kitItens.some((item) => item.produtoId === produto.id),
                          )
                          .map((produto) => (
                            <option key={produto.id} value={produto.id}>
                              {produto.nome} · {produto.essencia}
                              {medidaProduto(produto) ? ` · ${medidaProduto(produto)}` : ""}
                            </option>
                          ))}
                      </SelectInput>
                    </Field>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!produtoKitId}
                      onClick={() => {
                        const produto = produtosParaKit.find(
                          (produto) => produto.id === produtoKitId,
                        );
                        if (!produto || kitItens.some((item) => item.produtoId === produto.id))
                          return;
                        setKitItens([
                          ...kitItens,
                          {
                            produtoId: produto.id,
                            produtoNome: [produto.nome, produto.essencia, medidaProduto(produto)]
                              .filter(Boolean)
                              .join(" · "),
                            quantidade: 1,
                          },
                        ]);
                        setProdutoKitId("");
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                  {!produtosParaKit.length && (
                    <p className="text-sm text-muted-foreground">
                      Cadastre produtos individuais antes de montar um kit.
                    </p>
                  )}
                  {kitItens.map((item) => (
                    <div
                      key={item.produtoId}
                      className="flex items-center gap-2 border-t border-border pt-3"
                    >
                      <span className="min-w-0 flex-1 text-sm">{item.produtoNome}</span>
                      <TextInput
                        type="number"
                        min="1"
                        step="1"
                        className="w-20"
                        aria-label={`Quantidade de ${item.produtoNome} no kit`}
                        value={item.quantidade}
                        onChange={(e) =>
                          setKitItens(
                            kitItens.map((componente) =>
                              componente.produtoId === item.produtoId
                                ? { ...componente, quantidade: Number(e.target.value) }
                                : componente,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover ${item.produtoNome} do kit`}
                        onClick={() =>
                          setKitItens(
                            kitItens.filter(
                              (componente) => componente.produtoId !== item.produtoId,
                            ),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    {unidadesKit} kits disponíveis com o estoque atual · Custo por kit:{" "}
                    {brl(custoDoKit)}
                  </p>
                </div>
              )}
              {!ehKit && (
                <>
                  <Field label="Essência">
                    <TextInput
                      list="essencias-produtos"
                      value={form.essencia}
                      onChange={(e) => setForm({ ...form, essencia: e.target.value })}
                    />
                    <datalist id="essencias-produtos">
                      {essencias.map((item) => (
                        <option key={item} value={item} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Peso/volume">
                    <TextInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.medidaValor}
                      onChange={(e) => setForm({ ...form, medidaValor: e.target.value })}
                      placeholder="250"
                    />
                  </Field>
                  <Field label="Unidade">
                    <SelectInput
                      value={form.medidaUnidade}
                      onChange={(e) =>
                        setForm({ ...form, medidaUnidade: e.target.value as Unidade })
                      }
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
                      step="1"
                      value={form.quantidade}
                      onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    />
                  </Field>
                </>
              )}
              <Field label="Valor de venda">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorVenda}
                  onChange={(e) => setForm({ ...form, valorVenda: e.target.value })}
                />
              </Field>
              {!ehKit && (
                <Field label="Custo estimado">
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.custoEstimado}
                    onChange={(e) => setForm({ ...form, custoEstimado: e.target.value })}
                  />
                </Field>
              )}
              <Field label="Estoque mínimo">
                <TextInput
                  type="number"
                  min="0"
                  step="1"
                  value={form.estoqueMinimo}
                  onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                />
              </Field>
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
