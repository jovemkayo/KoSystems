type ErroSupabase = {
  code?: string;
  message?: string;
};

export function mensagemErroSupabase(entidade: string, erro: ErroSupabase) {
  const mensagem = erro.message?.toLowerCase() ?? "";

  if (
    erro.code === "PGRST204" ||
    mensagem.includes("schema cache") ||
    (mensagem.includes("column") && mensagem.includes("not found"))
  ) {
    return `O banco de dados precisa ser atualizado antes de salvar ${entidade}.`;
  }

  if (erro.code === "42501" || mensagem.includes("permission denied")) {
    return `Seu acesso não permite salvar ${entidade}. Saia da conta, entre novamente e tente de novo.`;
  }

  if (erro.code === "23503") {
    return `Um item usado em ${entidade} não existe mais. Atualize a página e tente novamente.`;
  }

  return `Não foi possível salvar ${entidade} no banco. Tente novamente.`;
}
