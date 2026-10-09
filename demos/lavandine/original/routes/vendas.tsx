import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ClientesACobrarPanel } from "@/components/clientes-a-cobrar-panel";
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
import {
  FORMAS_PAGAMENTO,
  brl,
  hojeISO,
  medidaProduto,
  num,
  novoId,
  quantidadeVenda,
  totalItemVenda,
  totalVenda,
  type Cliente,
  type FormaPagamento,
  type ItemVenda,
  type Produto,
  type Venda,
} from "@/lib/domain";
import {
  apenasDigitos,
  celularCompletoValido,
  dataBRParaISO,
  formatarCelular,
  formatarCep,
  formatarCpf,
  formatarDataDigitada,
} from "@/lib/formatadores";
import {
  statusPagamentoVenda,
  tomStatusPagamento,
  totalPagoVenda,
  totalPendenteVenda,
} from "@/lib/pagamentos-venda";
import { resumoFinanceiroDashboard } from "@/lib/dashboard-financeiro";
import { sugestoesProdutos } from "@/lib/autocomplete-produtos";
import { filtrarPeriodo, somarPor } from "@/lib/metricas";
import { ordenarVendas, type OrdenacaoVendas } from "@/lib/ordenacao";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [{ title: "Vendas - Lavandine" }] }),
  component: VendasPage,
});

type ItemForm = {
  produtoId: string;
  produtoBusca: string;
  quantidade: string;
  valorUnitario: string;
  desconto: string;
};

type TipoRecebimento = "avista" | "programado" | "parcelado";

type PagamentoForm = {
  id: string;
  data: string;
  valor: string;
  pago: boolean;
};

const itemVazio = {
  produtoId: "",
  produtoBusca: "",
  quantidade: "1",
  valorUnitario: "",
  desconto: "",
};

const inicial = {
  data: hojeISO(),
  formaPagamento: "Pix" as FormaPagamento,
  clienteId: "",
  cliente: "",
  frete: "",
  observacoes: "",
};

const clienteVendaInicial = {
  nome: "",
  celular: "",
  dataNascimento: "",
  cpf: "",
  cep: "",
  rua: "",
  numero: "",
  temComplemento: false,
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

type EnderecoCep = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

function itemParaForm(item: ItemVenda): ItemForm {
  return {
    produtoId: item.produtoId,
    produtoBusca: rotuloItemVenda(item),
    quantidade: String(item.quantidade),
    valorUnitario: String(item.valorUnitario),
    desconto: item.desconto ? String(item.desconto) : "",
  };
}

function VendasPage() {
  const { clientes, vendas, produtos, salvarCliente, salvarVenda, removerVenda } = useStore();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [pagamento, setPagamento] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [essencia, setEssencia] = useState("todas");
  const [ordenar, setOrdenar] = useState<OrdenacaoVendas>("mais-recente");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Venda | null>(null);
  const [form, setForm] = useState({ ...inicial });
  const [itens, setItens] = useState<ItemForm[]>([{ ...itemVazio }]);
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteVenda, setClienteVenda] = useState({ ...clienteVendaInicial });
  const [tipoRecebimento, setTipoRecebimento] = useState<TipoRecebimento>("avista");
  const [pagamentos, setPagamentos] = useState<PagamentoForm[]>([]);
  const [produtoAberto, setProdutoAberto] = useState<number | null>(null);

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(vendas.flatMap((venda) => venda.itens.map((item) => item.categoria))),
      ).sort(),
    [vendas],
  );
  const essencias = useMemo(
    () =>
      Array.from(
        new Set(vendas.flatMap((venda) => venda.itens.map((item) => item.essencia))),
      ).sort(),
    [vendas],
  );

  const filtradas = useMemo(
    () =>
      ordenarVendas(
        filtrarPeriodo(vendas, de, ate)
          .filter((item) => (pagamento === "todas" ? true : item.formaPagamento === pagamento))
          .filter((venda) =>
            categoria === "todas" ? true : venda.itens.some((item) => item.categoria === categoria),
          )
          .filter((venda) =>
            essencia === "todas" ? true : venda.itens.some((item) => item.essencia === essencia),
          ),
        ordenar,
      ),
    [ate, categoria, de, essencia, ordenar, pagamento, vendas],
  );

  const itensDoForm = itens
    .map((item) => {
      const produto = produtos.find((produtoItem) => produtoItem.id === item.produtoId);
      return produto ? montarItemVenda(item, produto) : null;
    })
    .filter((item): item is ItemVenda => Boolean(item));
  const totalFormulario =
    itensDoForm.reduce((soma, item) => soma + totalItemVenda(item), 0) + (Number(form.frete) || 0);
  const total = filtradas.reduce((s, item) => s + totalVenda(item), 0);
  const recebido = filtradas.reduce((s, item) => s + totalPagoVenda(item), 0);
  const pendente = filtradas.reduce((s, item) => s + totalPendenteVenda(item), 0);
  const porPagamento = somarPor(filtradas, (item) => item.formaPagamento, totalVenda);
  const financeiro = useMemo(
    () => resumoFinanceiroDashboard(vendas, clientes, hojeISO()),
    [clientes, vendas],
  );
  const nomesClientesPorId = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente.nome])),
    [clientes],
  );

  function abrirNova() {
    setEditando(null);
    setForm({ ...inicial, data: hojeISO() });
    setModalCliente(false);
    setClienteVenda({ ...clienteVendaInicial });
    setTipoRecebimento("avista");
    setPagamentos([]);
    setProdutoAberto(null);
    setItens([{ ...itemVazio }]);
    setAberto(true);
  }

  function abrirEdicao(venda: Venda) {
    setEditando(venda);
    setForm({
      data: venda.data,
      formaPagamento: venda.formaPagamento,
      clienteId: venda.clienteId ?? "",
      cliente: venda.cliente ?? "",
      frete: venda.frete ? String(venda.frete) : "",
      observacoes: venda.observacoes ?? "",
    });
    setModalCliente(false);
    setClienteVenda({ ...clienteVendaInicial });
    setTipoRecebimento(recebimentoDaVenda(venda));
    setProdutoAberto(null);
    setPagamentos(
      venda.pagamentos?.map((pagamento) => ({
        id: pagamento.id,
        data: pagamento.data,
        valor: String(pagamento.valor),
        pago: pagamento.pago,
      })) ?? [],
    );
    setItens(venda.itens.length ? venda.itens.map(itemParaForm) : [{ ...itemVazio }]);
    setAberto(true);
  }

  function alterarItem(indice: number, item: Partial<ItemForm>) {
    setItens((atuais) =>
      atuais.map((atual, posicao) => (posicao === indice ? { ...atual, ...item } : atual)),
    );
  }

  function escolherProduto(indice: number, produtoId: string) {
    const produto = produtos.find((item) => item.id === produtoId);
    alterarItem(indice, {
      produtoId,
      produtoBusca: produto ? rotuloProduto(produto) : "",
      valorUnitario: produto ? String(produto.valorVenda) : "",
    });
    setProdutoAberto(null);
  }

  function digitarProduto(indice: number, texto: string) {
    const normalizado = texto.trim().toLowerCase();
    const produto = produtos.find((item) => rotuloProduto(item).toLowerCase() === normalizado);
    alterarItem(indice, {
      produtoBusca: texto,
      ...(produto
        ? {
            produtoId: produto.id,
            valorUnitario: String(produto.valorVenda),
          }
        : { produtoId: "" }),
    });
  }

  function confirmarProdutoDigitado(indice: number) {
    const item = itens[indice];
    if (!item || item.produtoId) return;

    const busca = item.produtoBusca.trim();
    if (!busca) return;

    const produto = sugestoesProdutos(produtos, busca, 1)[0];
    if (produto) escolherProduto(indice, produto.id);
  }

  function adicionarItem() {
    setItens((atuais) => [...atuais, { ...itemVazio }]);
  }

  function removerItem(indice: number) {
    setItens((atuais) => atuais.filter((_, posicao) => posicao !== indice));
  }

  function escolherCliente(clienteId: string) {
    if (clienteId === "novo") {
      setClienteVenda({ ...clienteVendaInicial });
      setModalCliente(true);
      return;
    }
    const cliente = clientes.find((item) => item.id === clienteId);
    setForm({
      ...form,
      clienteId,
      cliente: cliente ? cliente.nome : form.cliente,
    });
  }

  async function buscarCepCliente(valor: string) {
    const cep = apenasDigitos(valor);
    if (cep.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = (await resposta.json()) as EnderecoCep;
      if (dados.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setClienteVenda((atual) => ({
        ...atual,
        rua: dados.logradouro ?? atual.rua,
        bairro: dados.bairro ?? atual.bairro,
        cidade: dados.localidade ?? atual.cidade,
        estado: dados.uf ?? atual.estado,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP agora.");
    }
  }

  async function salvarClienteDaVenda(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteVenda.nome.trim()) {
      toast.error("Informe o nome da cliente.");
      return;
    }
    if (!celularCompletoValido(clienteVenda.celular)) {
      toast.error("Informe um celular válido com DDD e 9 dígitos.");
      return;
    }

    const cliente: Omit<Cliente, "id"> = {
      nome: clienteVenda.nome.trim(),
      celular: clienteVenda.celular.trim(),
      ...(dataBRParaISO(clienteVenda.dataNascimento)
        ? { dataNascimento: dataBRParaISO(clienteVenda.dataNascimento) }
        : {}),
      ...(clienteVenda.cpf.trim() ? { cpf: clienteVenda.cpf.trim() } : {}),
      ...(clienteVenda.cep.trim() ? { cep: clienteVenda.cep.trim() } : {}),
      ...(clienteVenda.rua.trim() ? { rua: clienteVenda.rua.trim() } : {}),
      ...(clienteVenda.numero.trim() ? { numero: clienteVenda.numero.trim() } : {}),
      temComplemento: clienteVenda.temComplemento,
      ...(clienteVenda.temComplemento && clienteVenda.complemento.trim()
        ? { complemento: clienteVenda.complemento.trim() }
        : {}),
      ...(clienteVenda.bairro.trim() ? { bairro: clienteVenda.bairro.trim() } : {}),
      ...(clienteVenda.cidade.trim() ? { cidade: clienteVenda.cidade.trim() } : {}),
      ...(clienteVenda.estado.trim() ? { estado: clienteVenda.estado.trim().toUpperCase() } : {}),
    };

    const clienteId = await salvarCliente(cliente);
    if (!clienteId) return;
    setForm((atual) => ({ ...atual, clienteId, cliente: cliente.nome }));
    setModalCliente(false);
    toast.success("Cliente cadastrado.");
  }

  function alterarPagamento(indice: number, pagamento: Partial<PagamentoForm>) {
    setPagamentos((atuais) =>
      atuais.map((atual, posicao) => (posicao === indice ? { ...atual, ...pagamento } : atual)),
    );
  }

  function adicionarParcela() {
    setPagamentos((atuais) => [
      ...atuais,
      { id: novoId(), data: form.data, valor: "", pago: false },
    ]);
  }

  function removerParcela(indice: number) {
    setPagamentos((atuais) => atuais.filter((_, posicao) => posicao !== indice));
  }

  function mudarRecebimento(tipo: TipoRecebimento) {
    setTipoRecebimento(tipo);
    if (tipo === "avista") {
      setPagamentos([]);
      return;
    }
    if (tipo === "programado") {
      setPagamentos([
        { id: novoId(), data: form.data, valor: String(totalFormulario), pago: false },
      ]);
      return;
    }
    setPagamentos((atuais) =>
      atuais.length
        ? atuais
        : [{ id: novoId(), data: form.data, valor: String(totalFormulario), pago: false }],
    );
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    const itensVenda = itens
      .map((item) => {
        const produto = produtos.find((produtoItem) => produtoItem.id === item.produtoId);
        return produto ? montarItemVenda(item, produto) : null;
      })
      .filter((item): item is ItemVenda => Boolean(item));

    if (itensVenda.length === 0) {
      toast.error("Adicione pelo menos um produto.");
      return;
    }
    if (itensVenda.some((item) => item.quantidade <= 0)) {
      toast.error("Informe a quantidade dos produtos.");
      return;
    }

    const pagamentosVenda =
      tipoRecebimento === "avista"
        ? []
        : pagamentos.map((pagamento) => ({
            id: pagamento.id,
            data: pagamento.data,
            valor: Number(pagamento.valor) || 0,
            pago: pagamento.pago,
          }));

    if (pagamentosVenda.some((pagamento) => !pagamento.data || pagamento.valor <= 0)) {
      toast.error("Confira as datas e valores dos pagamentos.");
      return;
    }
    if (tipoRecebimento !== "avista") {
      const totalPagamentos = pagamentosVenda.reduce(
        (soma, pagamento) => soma + pagamento.valor,
        0,
      );
      if (Math.abs(totalPagamentos - totalFormulario) > 0.01) {
        toast.error("A soma dos pagamentos precisa bater com o total da venda.");
        return;
      }
    }

    const venda: Omit<Venda, "id"> & { id?: string } = {
      data: form.data,
      itens: itensVenda,
      formaPagamento: form.formaPagamento,
      frete: Number(form.frete) || 0,
      ...(pagamentosVenda.length ? { pagamentos: pagamentosVenda } : {}),
    };
    if (editando) venda.id = editando.id;
    if (form.clienteId) venda.clienteId = form.clienteId;
    if (form.cliente.trim()) venda.cliente = form.cliente.trim();
    if (form.observacoes.trim()) venda.observacoes = form.observacoes.trim();
    const salvou = await salvarVenda(venda);
    if (!salvou) return;

    setAberto(false);
    toast.success(editando ? "Venda atualizada." : "Venda registrada.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Vendas"
        subtitle="Histórico e recebimentos"
        action={
          <Button onClick={abrirNova} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova venda</span>
          </Button>
        }
      />

      <Panel title="Filtros" className="mb-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Field label="De">
            <TextInput type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </Field>
          <Field label="Até">
            <TextInput type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </Field>
          <Field label="Pagamento">
            <SelectInput value={pagamento} onChange={(e) => setPagamento(e.target.value)}>
              <option value="todas">Todas</option>
              {FORMAS_PAGAMENTO.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Tipo">
            <SelectInput value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="todas">Todos</option>
              {categorias.map((item) => (
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
              onChange={(e) => setOrdenar(e.target.value as OrdenacaoVendas)}
            >
              <option value="mais-recente">Mais recente</option>
              <option value="mais-antigo">Mais antigo</option>
              <option value="cliente-az">Cliente A-Z</option>
              <option value="produto-az">Produto A-Z</option>
              <option value="maior-valor">Maior valor</option>
              <option value="menor-valor">Menor valor</option>
              <option value="pendente-primeiro">Pendente primeiro</option>
              <option value="pago-primeiro">Pago primeiro</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total vendido" value={brl(total)} tone="positive" />
        <StatCard label="Recebido" value={brl(recebido)} tone="positive" />
        <StatCard label="Pendente" value={brl(pendente)} />
        <StatCard
          label="Unidades"
          value={num(filtradas.reduce((s, item) => s + quantidadeVenda(item), 0))}
        />
      </div>

      <ClientesACobrarPanel clientes={financeiro.clientesACobrar} className="mt-4" />

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel title="Histórico de vendas">
          {filtradas.length === 0 ? (
            <EmptyState>Nenhuma venda encontrada.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {filtradas.map((item) => {
                const status = statusPagamentoVenda(item);
                const tom = tomStatusPagamento(status);

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "my-2 flex items-center justify-between gap-3 rounded-lg border-l-4 px-3 py-3",
                      tom === "positive" && "border-success bg-success/5",
                      tom === "warning" && "border-warning bg-warning/5",
                      tom === "negative" && "border-destructive bg-destructive/5",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.cliente?.trim() ||
                          (item.clienteId ? nomesClientesPorId.get(item.clienteId) : undefined) ||
                          "Cliente não informado"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {item.itens.map((vendaItem) => vendaItem.produtoNome).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.formaPagamento} · {quantidadeVenda(item)} un. · {item.itens.length}{" "}
                        produto(s)
                        {item.frete ? ` · frete ${brl(item.frete)}` : ""}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-medium",
                          tom === "positive" && "text-success",
                          tom === "warning" && "text-warning-foreground",
                          tom === "negative" && "text-destructive",
                        )}
                      >
                        {rotuloStatusPagamento(status)}
                        {totalPendenteVenda(item) > 0
                          ? ` · falta ${brl(totalPendenteVenda(item))}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="mr-1 font-medium tabular-nums">{brl(totalVenda(item))}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar venda"
                        onClick={() => abrirEdicao(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir venda"
                        onClick={() => removerVenda(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title="Por forma de pagamento">
          <div className="space-y-2">
            {porPagamento.map((item) => (
              <div
                key={item.label}
                className="flex justify-between gap-3 rounded-lg bg-secondary px-3 py-2 text-sm"
              >
                <span>{item.label}</span>
                <strong>{brl(item.value)}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar venda" : "Nova venda"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              <Field label="Data">
                <TextInput
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </Field>
              <Field label="Forma de pagamento">
                <SelectInput
                  value={form.formaPagamento}
                  onChange={(e) =>
                    setForm({ ...form, formaPagamento: e.target.value as FormaPagamento })
                  }
                >
                  {FORMAS_PAGAMENTO.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Cliente cadastrado">
                <SelectInput
                  value={form.clienteId}
                  onChange={(e) => escolherCliente(e.target.value)}
                >
                  <option value="">Selecionar cliente</option>
                  <option value="novo">Cadastrar novo cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Cliente avulso">
                <TextInput
                  value={form.cliente}
                  onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                />
              </Field>
            </FormGrid>

            <Panel title="Produtos da venda">
              <div className="space-y-3">
                {itens.map((item, indice) => {
                  const produto = produtos.find((produtoItem) => produtoItem.id === item.produtoId);
                  const totalItem = produto ? totalItemVenda(montarItemVenda(item, produto)) : 0;
                  const produtosSugeridos = sugestoesProdutos(produtos, item.produtoBusca);

                  return (
                    <div
                      key={indice}
                      className="grid min-w-0 gap-2 rounded-lg border border-border p-3 lg:grid-cols-[minmax(360px,2fr)_90px_120px_120px_auto]"
                    >
                      <Field label="Produto">
                        <div>
                          <TextInput
                            value={item.produtoBusca}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            inputMode="search"
                            onFocus={() => setProdutoAberto(indice)}
                            onBlur={() => {
                              window.setTimeout(() => {
                                confirmarProdutoDigitado(indice);
                                setProdutoAberto((atual) => (atual === indice ? null : atual));
                              }, 150);
                            }}
                            onChange={(e) => {
                              digitarProduto(indice, e.target.value);
                              setProdutoAberto(indice);
                            }}
                          />
                          {produtoAberto === indice ? (
                            <div
                              className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-background shadow-sm"
                              onMouseDown={(event) => event.preventDefault()}
                            >
                              {produtosSugeridos.length > 0 ? (
                                produtosSugeridos.map((produtoItem: Produto) => {
                                  const medida = medidaProduto(produtoItem);

                                  return (
                                    <button
                                      key={produtoItem.id}
                                      type="button"
                                      className="flex min-h-12 w-full flex-col items-start justify-center border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary focus:bg-secondary focus:outline-none"
                                      onClick={() => escolherProduto(indice, produtoItem.id)}
                                    >
                                      <span className="font-medium">{produtoItem.nome}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {produtoItem.essencia}
                                        {medida ? ` · ${medida}` : ""}
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-3 text-sm text-muted-foreground">
                                  Nenhum produto encontrado.
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </Field>
                      <Field label="Qtd.">
                        <TextInput
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantidade}
                          onChange={(e) => alterarItem(indice, { quantidade: e.target.value })}
                        />
                      </Field>
                      <Field label="Valor unitário">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.valorUnitario}
                          onChange={(e) => alterarItem(indice, { valorUnitario: e.target.value })}
                        />
                      </Field>
                      <Field label="Desconto">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.desconto}
                          onChange={(e) => alterarItem(indice, { desconto: e.target.value })}
                        />
                      </Field>
                      <div className="flex items-end justify-between gap-2">
                        <span className="text-sm font-medium tabular-nums">{brl(totalItem)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover produto"
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
                Adicionar produto
              </Button>
            </Panel>

            <FormGrid>
              <Field label="Frete">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.frete}
                  onChange={(e) => setForm({ ...form, frete: e.target.value })}
                />
              </Field>
              <Field label="Observações">
                <TextArea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </Field>
            </FormGrid>

            <Panel title="Recebimento">
              <FormGrid>
                <Field label="Situação">
                  <SelectInput
                    value={tipoRecebimento}
                    onChange={(e) => mudarRecebimento(e.target.value as TipoRecebimento)}
                  >
                    <option value="avista">Pago à vista</option>
                    <option value="programado">Pagamento programado</option>
                    <option value="parcelado">Parcelado</option>
                  </SelectInput>
                </Field>
              </FormGrid>
              {tipoRecebimento !== "avista" ? (
                <div className="mt-3 space-y-3">
                  {pagamentos.map((pagamento, indice) => (
                    <div
                      key={pagamento.id}
                      className="grid min-w-0 gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_1fr_130px_auto]"
                    >
                      <Field label="Data">
                        <TextInput
                          type="date"
                          value={pagamento.data}
                          onChange={(e) => alterarPagamento(indice, { data: e.target.value })}
                        />
                      </Field>
                      <Field label="Valor">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={pagamento.valor}
                          onChange={(e) => alterarPagamento(indice, { valor: e.target.value })}
                        />
                      </Field>
                      <Field label="Pago?">
                        <SelectInput
                          value={pagamento.pago ? "sim" : "nao"}
                          onChange={(e) =>
                            alterarPagamento(indice, { pago: e.target.value === "sim" })
                          }
                        >
                          <option value="nao">Não</option>
                          <option value="sim">Sim</option>
                        </SelectInput>
                      </Field>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remover pagamento"
                          onClick={() => removerParcela(indice)}
                          disabled={tipoRecebimento === "programado" || pagamentos.length === 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tipoRecebimento === "parcelado" ? (
                    <Button type="button" variant="outline" size="sm" onClick={adicionarParcela}>
                      <Plus className="size-4" />
                      Adicionar pagamento
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </Panel>

            <div className="rounded-lg bg-secondary px-3 py-2 text-sm">
              Total: <strong>{brl(totalFormulario)}</strong>
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

      <Dialog open={modalCliente} onOpenChange={setModalCliente}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvarClienteDaVenda} className="space-y-4">
            <FormGrid>
              <Field label="Nome" className="sm:col-span-2">
                <TextInput
                  value={clienteVenda.nome}
                  onChange={(e) => setClienteVenda({ ...clienteVenda, nome: e.target.value })}
                />
              </Field>
              <Field label="Celular">
                <TextInput
                  value={clienteVenda.celular}
                  inputMode="numeric"
                  onChange={(e) =>
                    setClienteVenda({
                      ...clienteVenda,
                      celular: formatarCelular(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Data de nascimento">
                <TextInput
                  placeholder="__/__/____"
                  inputMode="numeric"
                  value={clienteVenda.dataNascimento}
                  onChange={(e) =>
                    setClienteVenda({
                      ...clienteVenda,
                      dataNascimento: formatarDataDigitada(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="CPF" className="sm:col-span-2">
                <TextInput
                  value={clienteVenda.cpf}
                  inputMode="numeric"
                  onChange={(e) =>
                    setClienteVenda({ ...clienteVenda, cpf: formatarCpf(e.target.value) })
                  }
                />
              </Field>
              <Field label="CEP">
                <TextInput
                  value={clienteVenda.cep}
                  inputMode="numeric"
                  onChange={(e) => {
                    const cep = formatarCep(e.target.value);
                    setClienteVenda({ ...clienteVenda, cep });
                    buscarCepCliente(cep);
                  }}
                />
              </Field>
              <Field label="Número">
                <TextInput
                  value={clienteVenda.numero}
                  onChange={(e) => setClienteVenda({ ...clienteVenda, numero: e.target.value })}
                />
              </Field>
              <Field label="Rua" className="sm:col-span-2">
                <TextInput
                  value={clienteVenda.rua}
                  onChange={(e) => setClienteVenda({ ...clienteVenda, rua: e.target.value })}
                />
              </Field>
              <Field label="Bairro">
                <TextInput
                  value={clienteVenda.bairro}
                  onChange={(e) => setClienteVenda({ ...clienteVenda, bairro: e.target.value })}
                />
              </Field>
              <Field label="Cidade">
                <TextInput
                  value={clienteVenda.cidade}
                  onChange={(e) => setClienteVenda({ ...clienteVenda, cidade: e.target.value })}
                />
              </Field>
              <Field label="Estado">
                <TextInput
                  value={clienteVenda.estado}
                  maxLength={2}
                  onChange={(e) =>
                    setClienteVenda({ ...clienteVenda, estado: e.target.value.toUpperCase() })
                  }
                />
              </Field>
              <Field label="Tem complemento?">
                <SelectInput
                  value={clienteVenda.temComplemento ? "sim" : "nao"}
                  onChange={(e) =>
                    setClienteVenda({
                      ...clienteVenda,
                      temComplemento: e.target.value === "sim",
                      complemento: e.target.value === "sim" ? clienteVenda.complemento : "",
                    })
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </SelectInput>
              </Field>
              {clienteVenda.temComplemento ? (
                <Field label="Complemento" className="sm:col-span-2">
                  <TextInput
                    value={clienteVenda.complemento}
                    onChange={(e) =>
                      setClienteVenda({ ...clienteVenda, complemento: e.target.value })
                    }
                  />
                </Field>
              ) : null}
            </FormGrid>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalCliente(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar cliente</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function rotuloProduto(produto: Produto) {
  const medida = medidaProduto(produto);
  return [produto.nome, produto.essencia, medida].filter(Boolean).join(" · ");
}

function rotuloItemVenda(item: ItemVenda) {
  const medida = medidaProduto(item);
  return [item.produtoNome, item.essencia, medida].filter(Boolean).join(" · ");
}

function recebimentoDaVenda(venda: Venda): TipoRecebimento {
  if (!venda.pagamentos?.length) return "avista";
  if (venda.pagamentos.length === 1 && !venda.pagamentos[0]?.pago) return "programado";
  return "parcelado";
}

function rotuloStatusPagamento(status: ReturnType<typeof statusPagamentoVenda>) {
  if (status === "pago") return "Pago";
  if (status === "parcial") return "Parcial";
  return "Pendente";
}

function montarItemVenda(item: ItemForm, produto: Produto): ItemVenda {
  return {
    produtoId: produto.id,
    produtoNome: produto.nome,
    categoria: produto.categoria,
    essencia: produto.essencia,
    medidaValor: produto.medidaValor,
    medidaUnidade: produto.medidaUnidade,
    quantidade: Number(item.quantidade) || 0,
    valorUnitario: Number(item.valorUnitario) || 0,
    desconto: Number(item.desconto) || 0,
  };
}
