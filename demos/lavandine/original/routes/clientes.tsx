import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ClienteAvulsoCard } from "@/components/cliente-avulso-card";
import { ClientesACobrarPanel } from "@/components/clientes-a-cobrar-panel";
import { Field, FormGrid, SelectInput, TextInput } from "@/components/form-kit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Panel, StatCard } from "@/components/ui-kit";
import { dataBR, hojeISO, type Cliente } from "@/lib/domain";
import { resumoFinanceiroDashboard } from "@/lib/dashboard-financeiro";
import {
  apenasDigitos,
  celularCompletoValido,
  dataBRParaISO,
  dataISOParaBR,
  formatarCelular,
  formatarCep,
  formatarCpf,
  formatarDataDigitada,
} from "@/lib/formatadores";
import { clientesAvulsosDasVendas } from "@/lib/clientes-avulsos";
import { ordenarClientes, type OrdenacaoClientes } from "@/lib/ordenacao";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes - Lavandine" }] }),
  component: ClientesPage,
});

const inicial = {
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

function ClientesPage() {
  const { clientes, vendas, salvarCliente, vincularClienteAvulso, removerCliente } = useStore();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [clienteAvulso, setClienteAvulso] = useState<string | null>(null);
  const [form, setForm] = useState({ ...inicial });
  const [ordenar, setOrdenar] = useState<OrdenacaoClientes>("mais-recente");
  const dataInputRef = useRef<HTMLInputElement>(null);

  const filtrados = useMemo(
    () =>
      ordenarClientes(
        clientes.filter((item) =>
          `${item.nome} ${item.celular} ${item.cpf ?? ""} ${item.rua ?? ""} ${item.cidade ?? ""}`
            .toLowerCase()
            .includes(busca.toLowerCase()),
        ),
        ordenar,
      ),
    [busca, clientes, ordenar],
  );
  const clientesAvulsos = useMemo(() => clientesAvulsosDasVendas(vendas), [vendas]);
  const clientesAvulsosFiltrados = useMemo(
    () => clientesAvulsos.filter((nome) => nome.toLowerCase().includes(busca.trim().toLowerCase())),
    [busca, clientesAvulsos],
  );
  const totalClientes = clientes.length + clientesAvulsos.length;
  const financeiro = useMemo(
    () => resumoFinanceiroDashboard(vendas, clientes, hojeISO()),
    [clientes, vendas],
  );

  function abrirNovo() {
    setEditando(null);
    setClienteAvulso(null);
    setForm({ ...inicial });
    setAberto(true);
  }

  function abrirCadastroAvulso(nome: string) {
    setEditando(null);
    setClienteAvulso(nome);
    setForm({ ...inicial, nome });
    setAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setEditando(cliente);
    setClienteAvulso(null);
    setForm({
      nome: cliente.nome,
      celular: cliente.celular,
      dataNascimento: cliente.dataNascimento ? dataISOParaBR(cliente.dataNascimento) : "",
      cpf: cliente.cpf ?? "",
      cep: cliente.cep ?? "",
      rua: cliente.rua ?? "",
      numero: cliente.numero ?? "",
      temComplemento: cliente.temComplemento ?? false,
      complemento: cliente.complemento ?? "",
      bairro: cliente.bairro ?? "",
      cidade: cliente.cidade ?? "",
      estado: cliente.estado ?? "",
    });
    setAberto(true);
  }

  async function buscarCep(valor: string) {
    const cep = apenasDigitos(valor);
    if (cep.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = (await resposta.json()) as EnderecoCep;
      if (dados.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((atual) => ({
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

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe o nome da cliente.");
      return;
    }
    if (!celularCompletoValido(form.celular)) {
      toast.error("Informe um celular válido com DDD e 9 dígitos.");
      return;
    }

    const clienteId = await salvarCliente({
      ...(editando ? { id: editando.id } : {}),
      nome: form.nome.trim(),
      celular: form.celular.trim(),
      ...(dataBRParaISO(form.dataNascimento)
        ? { dataNascimento: dataBRParaISO(form.dataNascimento) }
        : {}),
      ...(form.cpf.trim() ? { cpf: form.cpf.trim() } : {}),
      ...(form.cep.trim() ? { cep: form.cep.trim() } : {}),
      ...(form.rua.trim() ? { rua: form.rua.trim() } : {}),
      ...(form.numero.trim() ? { numero: form.numero.trim() } : {}),
      temComplemento: form.temComplemento,
      ...(form.temComplemento && form.complemento.trim()
        ? { complemento: form.complemento.trim() }
        : {}),
      ...(form.bairro.trim() ? { bairro: form.bairro.trim() } : {}),
      ...(form.cidade.trim() ? { cidade: form.cidade.trim() } : {}),
      ...(form.estado.trim() ? { estado: form.estado.trim().toUpperCase() } : {}),
    });
    if (!clienteId) return;
    const vinculou = clienteAvulso ? await vincularClienteAvulso(clienteAvulso, clienteId) : true;
    setAberto(false);
    if (!vinculou) return;
    toast.success(editando ? "Cliente atualizado." : "Cliente cadastrado.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro simples para vendas e contatos"
        action={
          <Button onClick={abrirNovo} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo cliente</span>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Clientes" value={String(totalClientes)} hint="Total" />
        <StatCard label="Cadastrados" value={String(clientes.length)} />
        <StatCard label="Avulsos" value={String(clientesAvulsos.length)} />
      </div>

      <ClientesACobrarPanel clientes={financeiro.clientesACobrar} className="mt-4" />

      <Panel title="Buscar clientes" className="mt-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
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
          <Field label="Ordenar">
            <SelectInput
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as OrdenacaoClientes)}
            >
              <option value="mais-recente">Mais recente</option>
              <option value="mais-antigo">Mais antigo</option>
              <option value="nome-az">Nome A-Z</option>
              <option value="nome-za">Nome Z-A</option>
              <option value="completo-primeiro">Cadastro completo primeiro</option>
              <option value="aniversario">Aniversário próximo</option>
            </SelectInput>
          </Field>
        </div>
      </Panel>

      <Panel title="Lista de clientes" className="mt-4">
        {filtrados.length === 0 && clientesAvulsosFiltrados.length === 0 ? (
          <EmptyState>Nenhum cliente encontrado.</EmptyState>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((cliente) => (
              <li key={cliente.id} className="rounded-lg border border-border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.celular}</p>
                    <p className="text-xs text-muted-foreground">
                      {cliente.dataNascimento ? dataBR(cliente.dataNascimento) : "Sem nascimento"}
                      {cliente.cpf ? ` · CPF ${cliente.cpf}` : ""}
                    </p>
                    {cliente.rua || cliente.cidade ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {[cliente.rua, cliente.numero, cliente.bairro, cliente.cidade]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar cliente"
                      onClick={() => abrirEdicao(cliente)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir cliente"
                      onClick={() => {
                        removerCliente(cliente.id);
                        toast.success("Cliente excluído.");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {clientesAvulsosFiltrados.map((nome) => (
              <ClienteAvulsoCard key={nome} nome={nome} onCadastrar={abrirCadastroAvulso} />
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editando
                ? "Editar cliente"
                : clienteAvulso
                  ? "Cadastrar cliente avulso"
                  : "Novo cliente"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submeter} className="space-y-4">
            <FormGrid>
              <Field label="Nome" className="sm:col-span-2">
                <TextInput
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </Field>
              <Field label="Celular">
                <TextInput
                  value={form.celular}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, celular: formatarCelular(e.target.value) })}
                />
              </Field>
              <Field label="Data de nascimento">
                <div className="relative">
                  <TextInput
                    placeholder="__/__/____"
                    inputMode="numeric"
                    className="pr-11"
                    value={form.dataNascimento}
                    onChange={(e) =>
                      setForm({ ...form, dataNascimento: formatarDataDigitada(e.target.value) })
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Abrir calendário"
                    onClick={() => dataInputRef.current?.showPicker()}
                  >
                    <CalendarDays className="size-4" />
                  </button>
                  <input
                    ref={dataInputRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-0 size-0 opacity-0"
                    value={dataBRParaISO(form.dataNascimento)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dataNascimento: e.target.value ? dataISOParaBR(e.target.value) : "",
                      })
                    }
                  />
                </div>
              </Field>
              <Field label="CPF" className="sm:col-span-2">
                <TextInput
                  value={form.cpf}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
                />
              </Field>
              <Field label="CEP">
                <TextInput
                  value={form.cep}
                  inputMode="numeric"
                  onChange={(e) => {
                    const cep = formatarCep(e.target.value);
                    setForm({ ...form, cep });
                    buscarCep(cep);
                  }}
                />
              </Field>
              <Field label="Número">
                <TextInput
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </Field>
              <Field label="Rua" className="sm:col-span-2">
                <TextInput
                  value={form.rua}
                  onChange={(e) => setForm({ ...form, rua: e.target.value })}
                />
              </Field>
              <Field label="Bairro">
                <TextInput
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                />
              </Field>
              <Field label="Cidade">
                <TextInput
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
              </Field>
              <Field label="Estado">
                <TextInput
                  value={form.estado}
                  maxLength={2}
                  onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Tem complemento?">
                <SelectInput
                  value={form.temComplemento ? "sim" : "nao"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      temComplemento: e.target.value === "sim",
                      complemento: e.target.value === "sim" ? form.complemento : "",
                    })
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </SelectInput>
              </Field>
              {form.temComplemento ? (
                <Field label="Complemento" className="sm:col-span-2">
                  <TextInput
                    value={form.complemento}
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                  />
                </Field>
              ) : null}
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
