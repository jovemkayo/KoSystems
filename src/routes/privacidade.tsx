import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade | KO Systems" },
      { name: "description", content: "Informações de privacidade do site da KO Systems." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="legal-page">
      <Link to="/" className="legal-back">
        ← Voltar para o início
      </Link>
      <span className="eyebrow">Privacidade</span>
      <h1>Uma experiência simples, sem coleta desnecessária.</h1>
      <p>
        Este site apresenta a KO Systems e seus serviços. Não há formulário de contato, cadastro de
        usuários ou envio de arquivos.
      </p>
      <h2>Contato por terceiros</h2>
      <p>
        Ao escolher falar pelo WhatsApp ou visitar o Instagram, você acessa uma plataforma externa,
        sujeita às políticas e práticas de privacidade do respectivo serviço.
      </p>
      <h2>Dados técnicos</h2>
      <p>
        A infraestrutura de hospedagem poderá registrar dados técnicos essenciais, como endereço IP,
        data, horário e informações do navegador, para segurança e funcionamento do site.
      </p>
      <p className="legal-updated">Última atualização: outubro de 2026.</p>
    </main>
  );
}
