import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase, supabaseConfigurado } from "./supabase";

type AuthValue = {
  carregando: boolean;
  configurado: boolean;
  recuperandoSenha: boolean;
  sessao: Session | null;
  usuario: User | null;
  entrarComEmail: (email: string, senha: string) => Promise<void>;
  criarConta: (email: string, senha: string) => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  atualizarSenha: (senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(supabaseConfigurado);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSessao(novaSessao);
      if (evento === "PASSWORD_RECOVERY") setRecuperandoSenha(true);
      setCarregando(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      carregando,
      configurado: supabaseConfigurado,
      recuperandoSenha,
      sessao,
      usuario: sessao?.user ?? null,
      entrarComEmail: async (email, senha) => {
        if (!supabase) throw new Error("A conexão ainda não foi configurada.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      },
      criarConta: async (email, senha) => {
        if (!supabase) throw new Error("A conexão ainda não foi configurada.");
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
      },
      recuperarSenha: async (email) => {
        if (!supabase) throw new Error("A conexão ainda não foi configurada.");
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
      },
      atualizarSenha: async (senha) => {
        if (!supabase) throw new Error("A conexão ainda não foi configurada.");
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        setRecuperandoSenha(false);
      },
      sair: async () => {
        if (!supabase) return;
        setRecuperandoSenha(false);
        await supabase.auth.signOut();
      },
    }),
    [carregando, recuperandoSenha, sessao],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
