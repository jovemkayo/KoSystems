import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre mim | KO Systems" },
      { name: "description", content: "Conheça quem está por trás da KO Systems." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="about-page">
      <Link to="/" className="about-back">
        ← Voltar para o início
      </Link>
      <section className="about-introduction" aria-labelledby="about-title">
        <div className="about-copy">
          <span className="eyebrow">KO Systems</span>
          <h1 id="about-title">Sobre mim</h1>
        </div>
        <img
          src="/profile/kayo-oliveira.jpeg"
          alt="Retrato de Kayo"
          className="about-portrait"
          width="1023"
          height="1537"
        />
      </section>
    </main>
  );
}
