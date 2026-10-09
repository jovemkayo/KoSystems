import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth";
import {
  novoId,
  type Cliente,
  type Compra,
  type InsumoEstoque,
  type Producao,
  type Produto,
  type Venda,
} from "./domain";
import {
  aplicarCompraNoEstoque,
  aplicarProducaoNoEstoque,
  aplicarVendaNoEstoque,
} from "./estoque-regras";
import { dadosIniciaisDoAplicativo } from "./dados-iniciais";
import { vendasDoClienteAvulso } from "./clientes-avulsos";
import { mensagemErroSupabase } from "./erros-supabase";
import { aplicarVendaComKits, atualizarDisponibilidadeKits, validarItensKit } from "./kits";
import { supabase, supabaseConfigurado } from "./supabase";
import {
  compraFromRow,
  compraToRow,
  clienteFromRow,
  clienteToRow,
  insumoFromRow,
  insumoToRow,
  producaoFromRow,
  producaoItemToRow,
  producaoToRow,
  produtoFromRow,
  produtoToRow,
  vendaFromRow,
  vendaItemToRow,
  vendaToRow,
} from "./supabase-data";

type StoreValue = {
  compras: Compra[];
  clientes: Cliente[];
  insumos: InsumoEstoque[];
  producoes: Producao[];
  produtos: Produto[];
  vendas: Venda[];
  salvarCliente: (cliente: Omit<Cliente, "id"> & { id?: string }) => Promise<string | null>;
  vincularClienteAvulso: (nome: string, clienteId: string) => Promise<boolean>;
  removerCliente: (id: string) => void;
  salvarCompra: (compra: Omit<Compra, "id"> & { id?: string }) => Promise<boolean>;
  removerCompra: (id: string) => void;
  salvarInsumo: (insumo: Omit<InsumoEstoque, "id"> & { id?: string }) => Promise<boolean>;
  ajustarInsumo: (id: string, delta: number) => void;
  removerInsumo: (id: string) => void;
  salvarProduto: (produto: Omit<Produto, "id"> & { id?: string }) => Promise<boolean>;
  ajustarProduto: (id: string, delta: number) => void;
  removerProduto: (id: string) => void;
  salvarProducao: (producao: Omit<Producao, "id"> & { id?: string }) => Promise<boolean>;
  removerProducao: (id: string) => void;
  salvarVenda: (venda: Omit<Venda, "id"> & { id?: string }) => Promise<boolean>;
  removerVenda: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const dadosIniciais = dadosIniciaisDoAplicativo(supabaseConfigurado);
  const [compras, setCompras] = useState<Compra[]>(dadosIniciais.compras);
  const [clientes, setClientes] = useState<Cliente[]>(dadosIniciais.clientes);
  const [insumos, setInsumos] = useState<InsumoEstoque[]>(dadosIniciais.insumos);
  const [producoes, setProducoes] = useState<Producao[]>(dadosIniciais.producoes);
  const [produtos, setProdutos] = useState<Produto[]>(dadosIniciais.produtos);
  const [vendas, setVendas] = useState<Venda[]>(dadosIniciais.vendas);
  const { usuario } = useAuth();
  const usuarioId = usuario?.id;
  const online = Boolean(supabase && usuario);
  const [carregandoDados, setCarregandoDados] = useState(online);

  useEffect(() => {
    if (!supabase || !usuarioId) {
      setCarregandoDados(false);
      return;
    }

    let ativo = true;
    setCarregandoDados(true);

    async function carregarDados() {
      const [
        comprasResposta,
        clientesResposta,
        insumosResposta,
        produtosResposta,
        producoesResposta,
        vendasResposta,
      ] = await Promise.all([
        supabase!.from("compras").select("*").order("data", { ascending: false }),
        supabase!.from("clientes").select("*").order("nome"),
        supabase!.from("insumos").select("*").order("nome"),
        supabase!.from("produtos").select("*").order("nome"),
        supabase!
          .from("producoes")
          .select("*, producao_itens(*)")
          .order("data", { ascending: false }),
        supabase!.from("vendas").select("*, venda_itens(*)").order("data", { ascending: false }),
      ]);

      if (!ativo) return;

      if (comprasResposta.error) console.error(comprasResposta.error);
      if (clientesResposta.error) console.error(clientesResposta.error);
      if (insumosResposta.error) console.error(insumosResposta.error);
      if (produtosResposta.error) console.error(produtosResposta.error);
      if (producoesResposta.error) console.error(producoesResposta.error);
      if (vendasResposta.error) console.error(vendasResposta.error);

      setCompras((comprasResposta.data ?? []).map(compraFromRow));
      setClientes((clientesResposta.data ?? []).map(clienteFromRow));
      setInsumos((insumosResposta.data ?? []).map(insumoFromRow));
      setProdutos((produtosResposta.data ?? []).map(produtoFromRow));
      setProducoes((producoesResposta.data ?? []).map(producaoFromRow));
      setVendas((vendasResposta.data ?? []).map(vendaFromRow));
      setCarregandoDados(false);
    }

    carregarDados();
    const intervalo = window.setInterval(carregarDados, 15000);
    const atualizarAoVoltar = () => {
      if (document.visibilityState === "visible") carregarDados();
    };
    window.addEventListener("focus", carregarDados);
    document.addEventListener("visibilitychange", atualizarAoVoltar);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener("focus", carregarDados);
      document.removeEventListener("visibilitychange", atualizarAoVoltar);
    };
  }, [usuarioId]);

  if (carregandoDados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <p className="font-medium text-foreground">Carregando dados</p>
          <p className="mt-1 text-sm text-muted-foreground">Buscando as informações salvas.</p>
        </div>
      </div>
    );
  }

  async function salvarRemoto(
    tabela: string,
    row: Record<string, unknown>,
    editando: boolean,
    entidade: string,
  ) {
    if (!supabase) return true;
    if (!online) {
      toast.error(`Entre novamente para salvar ${entidade}.`);
      return false;
    }
    const resposta = editando
      ? await supabase
          .from(tabela)
          .update(row)
          .eq("id", row["id"] as string)
      : await supabase.from(tabela).insert(row);
    if (resposta.error) {
      console.error(resposta.error);
      toast.error(mensagemErroSupabase(entidade, resposta.error));
      return false;
    }
    return true;
  }

  async function removerRemoto(tabela: string, id: string) {
    if (!supabase || !online) return;
    const { error } = await supabase.from(tabela).delete().eq("id", id);
    if (error) console.error(error);
  }

  async function salvarInsumosRemotos(itens: InsumoEstoque[]) {
    if (!supabase || !online || itens.length === 0) return;
    const { error } = await supabase.from("insumos").upsert(itens.map(insumoToRow));
    if (error) console.error(error);
  }

  async function salvarProdutosRemotos(itens: Produto[]) {
    if (!supabase || !online || itens.length === 0) return;
    const { error } = await supabase.from("produtos").upsert(itens.map(produtoToRow));
    if (error) console.error(error);
  }

  async function salvarProducaoRemota(producao: Producao, editando: boolean) {
    if (!supabase) return true;
    if (!online) {
      toast.error("Entre novamente para salvar produção.");
      return false;
    }

    const row = producaoToRow(producao);
    const resposta = editando
      ? await supabase.from("producoes").update(row).eq("id", producao.id)
      : await supabase.from("producoes").insert(row);

    if (resposta.error) {
      console.error(resposta.error);
      toast.error(mensagemErroSupabase("produção", resposta.error));
      return false;
    }

    const exclusao = await supabase.from("producao_itens").delete().eq("producao_id", producao.id);
    if (exclusao.error) {
      console.error(exclusao.error);
      toast.error(mensagemErroSupabase("produção", exclusao.error));
      return false;
    }

    const insercao = await supabase
      .from("producao_itens")
      .insert(producao.itens.map((item) => producaoItemToRow(producao.id, item)));
    if (insercao.error) {
      console.error(insercao.error);
      toast.error(mensagemErroSupabase("produção", insercao.error));
      return false;
    }
    return true;
  }

  async function salvarVendaRemota(venda: Venda, editando: boolean) {
    if (!supabase) return true;
    if (!online) {
      toast.error("Entre novamente para salvar venda.");
      return false;
    }

    const row = vendaToRow(venda);
    const resposta = editando
      ? await supabase.from("vendas").update(row).eq("id", venda.id)
      : await supabase.from("vendas").insert(row);

    if (resposta.error) {
      console.error(resposta.error);
      toast.error(mensagemErroSupabase("venda", resposta.error));
      return false;
    }

    const exclusao = await supabase.from("venda_itens").delete().eq("venda_id", venda.id);
    if (exclusao.error) {
      console.error(exclusao.error);
      toast.error(mensagemErroSupabase("venda", exclusao.error));
      return false;
    }

    const insercao = await supabase
      .from("venda_itens")
      .insert(venda.itens.map((item) => vendaItemToRow(venda.id, item)));
    if (insercao.error) {
      console.error(insercao.error);
      toast.error(mensagemErroSupabase("venda", insercao.error));
      return false;
    }

    return true;
  }

  const value: StoreValue = {
    compras,
    clientes,
    insumos,
    producoes,
    produtos: atualizarDisponibilidadeKits(produtos),
    vendas,
    salvarCliente: async (cliente) => {
      const clienteSalvo = { ...cliente, id: cliente.id ?? novoId() } as Cliente;
      const salvou = await salvarRemoto(
        "clientes",
        clienteToRow(clienteSalvo),
        Boolean(cliente.id),
        "cliente",
      );
      if (!salvou) return null;
      setClientes((atual) =>
        cliente.id
          ? atual.map((item) => (item.id === cliente.id ? clienteSalvo : item))
          : [...atual, clienteSalvo],
      );
      return clienteSalvo.id;
    },
    vincularClienteAvulso: async (nome, clienteId) => {
      const vendasParaVincular = vendasDoClienteAvulso(vendas, nome);
      if (vendasParaVincular.length === 0) return true;
      if (supabase && !online) {
        toast.error("Entre novamente para vincular as vendas ao cliente.");
        return false;
      }

      if (supabase) {
        const { error } = await supabase
          .from("vendas")
          .update({ cliente_id: clienteId })
          .in(
            "id",
            vendasParaVincular.map((venda) => venda.id),
          )
          .is("cliente_id", null);
        if (error) {
          console.error(error);
          toast.error("Cliente cadastrado, mas não foi possível vincular as vendas anteriores.");
          return false;
        }
      }

      const ids = new Set(vendasParaVincular.map((venda) => venda.id));
      setVendas((atuais) =>
        atuais.map((venda) => (ids.has(venda.id) ? { ...venda, clienteId } : venda)),
      );
      return true;
    },
    removerCliente: (id) => {
      setClientes((atual) => atual.filter((item) => item.id !== id));
      removerRemoto("clientes", id);
    },
    salvarCompra: async (compra) => {
      const compraSalva = { ...compra, id: compra.id ?? novoId() } as Compra;
      const salvou = await salvarRemoto(
        "compras",
        compraToRow(compraSalva),
        Boolean(compra.id),
        "compra",
      );
      if (!salvou) return false;
      setCompras((atual) =>
        compra.id
          ? atual.map((c) => (c.id === compra.id ? compraSalva : c))
          : [compraSalva, ...atual],
      );
      if (!compra.id) {
        setInsumos((atual) => {
          const atualizados = aplicarCompraNoEstoque(atual, compraSalva);
          salvarInsumosRemotos(atualizados);
          return atualizados;
        });
      }
      return true;
    },
    removerCompra: (id) => {
      setCompras((atual) => atual.filter((c) => c.id !== id));
      removerRemoto("compras", id);
    },
    salvarInsumo: async (insumo) => {
      const itemSalvo = { ...insumo, id: insumo.id ?? novoId() } as InsumoEstoque;
      const salvou = await salvarRemoto(
        "insumos",
        insumoToRow(itemSalvo),
        Boolean(insumo.id),
        "item de estoque",
      );
      if (!salvou) return false;
      setInsumos((atual) =>
        insumo.id
          ? atual.map((item) => (item.id === insumo.id ? itemSalvo : item))
          : [...atual, itemSalvo],
      );
      return true;
    },
    ajustarInsumo: (id, delta) =>
      setInsumos((atual) => {
        const atualizados = atual.map((i) =>
          i.id === id ? { ...i, quantidade: Math.max(0, i.quantidade + delta) } : i,
        );
        const alterado = atualizados.find((item) => item.id === id);
        if (alterado) salvarRemoto("insumos", insumoToRow(alterado), true, "item de estoque");
        return atualizados;
      }),
    removerInsumo: (id) => {
      setInsumos((atual) => atual.filter((i) => i.id !== id));
      removerRemoto("insumos", id);
    },
    salvarProduto: async (produto) => {
      if (
        produto.id &&
        produtos.find((item) => item.id === produto.id)?.categoria === "Kits" &&
        produto.categoria !== "Kits"
      ) {
        toast.error("Um kit deve continuar na categoria Kits.");
        return false;
      }
      if (produto.categoria === "Kits") {
        const erro = validarItensKit(produtos, produto.kitItens ?? [], produto.id);
        if (erro) {
          toast.error(erro);
          return false;
        }
        if (
          produto.id &&
          produtos.some((item) =>
            item.kitItens?.some((componente) => componente.produtoId === produto.id),
          )
        ) {
          toast.error("Este produto compõe outro kit e não pode ser convertido em kit.");
          return false;
        }
      }
      const produtoSalvo = { ...produto, id: produto.id ?? novoId() } as Produto;
      const salvou = await salvarRemoto(
        "produtos",
        produtoToRow(produtoSalvo),
        Boolean(produto.id),
        "produto",
      );
      if (!salvou) return false;
      setProdutos((atual) =>
        produto.id
          ? atual.map((item) => (item.id === produto.id ? produtoSalvo : item))
          : [...atual, produtoSalvo],
      );
      return true;
    },
    ajustarProduto: (id, delta) =>
      setProdutos((atual) => {
        if (atual.find((produto) => produto.id === id)?.categoria === "Kits") return atual;
        const atualizados = atual.map((p) =>
          p.id === id ? { ...p, quantidade: Math.max(0, p.quantidade + delta) } : p,
        );
        const alterado = atualizados.find((item) => item.id === id);
        if (alterado) salvarRemoto("produtos", produtoToRow(alterado), true, "produto");
        return atualizados;
      }),
    removerProduto: (id) => {
      if (produtos.some((produto) => produto.kitItens?.some((item) => item.produtoId === id))) {
        toast.error("Remova este produto da composição dos kits antes de excluí-lo.");
        return;
      }
      setProdutos((atual) => atual.filter((p) => p.id !== id));
      removerRemoto("produtos", id);
    },
    salvarProducao: async (producao) => {
      const producaoSalva = { ...producao, id: producao.id ?? novoId() } as Producao;
      const salvou = await salvarProducaoRemota(producaoSalva, Boolean(producao.id));
      if (!salvou) return false;
      setProducoes((atual) =>
        producao.id
          ? atual.map((item) => (item.id === producao.id ? producaoSalva : item))
          : [producaoSalva, ...atual],
      );
      if (!producao.id) {
        setInsumos((insumosAtuais) => {
          const resultado = aplicarProducaoNoEstoque(insumosAtuais, produtos, producaoSalva);
          setProdutos(resultado.produtos);
          salvarInsumosRemotos(resultado.insumos);
          salvarProdutosRemotos(resultado.produtos);
          return resultado.insumos;
        });
      }
      return true;
    },
    removerProducao: (id) => {
      setProducoes((atual) => atual.filter((item) => item.id !== id));
      removerRemoto("producoes", id);
    },
    salvarVenda: async (venda) => {
      const vendaSalva = { ...venda, id: venda.id ?? novoId() } as Venda;
      const anterior = vendas.find((item) => item.id === venda.id);
      const temKit = [...venda.itens, ...(anterior?.itens ?? [])].some(
        (item) =>
          item.categoria === "Kits" ||
          produtos.find((produto) => produto.id === item.produtoId)?.categoria === "Kits",
      );
      if (temKit || supabase) {
        if (supabase && !online) {
          toast.error("Entre novamente para salvar venda.");
          return false;
        }
        vendaSalva.itens = venda.itens.map((item) => {
          const produto = produtos.find((produto) => produto.id === item.produtoId);
          if (produto?.categoria !== "Kits") return item;
          const snapshot = anterior?.itens.find(
            (antigo) => antigo.produtoId === item.produtoId,
          )?.kitItens;
          return { ...item, kitItens: snapshot ?? produto.kitItens ?? [] };
        });
        let atualizados: Produto[];
        try {
          atualizados = aplicarVendaComKits(produtos, vendaSalva, anterior);
        } catch (erro) {
          toast.error(
            erro instanceof Error ? erro.message : "Confira o estoque dos produtos do kit.",
          );
          return false;
        }
        if (supabase) {
          const { data, error } = await supabase.rpc("salvar_venda_com_kits", {
            p_venda: vendaToRow(vendaSalva),
            p_itens: vendaSalva.itens.map((item) => vendaItemToRow(vendaSalva.id, item)),
          });
          if (error) {
            toast.error(
              error.message?.includes("Estoque insuficiente")
                ? error.message
                : mensagemErroSupabase("venda de kit", error),
            );
            return false;
          }
          setProdutos(data.produtos.map(produtoFromRow));
          const salva = vendaFromRow(data.venda);
          setVendas((atual) =>
            venda.id
              ? atual.map((item) => (item.id === venda.id ? salva : item))
              : [salva, ...atual],
          );
        } else {
          setProdutos(atualizados);
          setVendas((atual) =>
            venda.id
              ? atual.map((item) => (item.id === venda.id ? vendaSalva : item))
              : [vendaSalva, ...atual],
          );
        }
        return true;
      }
      const salvou = await salvarVendaRemota(vendaSalva, Boolean(venda.id));
      if (!salvou) return false;

      setVendas((atual) =>
        venda.id ? atual.map((v) => (v.id === venda.id ? vendaSalva : v)) : [vendaSalva, ...atual],
      );
      if (!venda.id) {
        setProdutos((atual) => {
          const atualizados = aplicarVendaNoEstoque(atual, vendaSalva);
          salvarProdutosRemotos(atualizados);
          return atualizados;
        });
      }
      return true;
    },
    removerVenda: (id) => {
      setVendas((atual) => atual.filter((v) => v.id !== id));
      removerRemoto("vendas", id);
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
