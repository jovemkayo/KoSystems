import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import heroLogoAsset from "@/assets/ko-symbol.png.asset.json";
import serviceSistemas from "@/assets/service-sistemas.jpg";
import serviceWebMobile from "@/assets/service-web-mobile.jpg";
import serviceIntegracoes from "@/assets/service-integracoes.jpg";
import serviceEvolucao from "@/assets/service-evolucao.jpg";
import projetoGestaoLinhas from "@/assets/projeto-gestao-linhas.png.asset.json";
import projetoPdvRestaurante from "@/assets/projeto-pdv-restaurante.png.asset.json";
import projetoGestaoArtesanal from "@/assets/projeto-gestao-artesanal.png.asset.json";
import projetoRecrutamento from "@/assets/projeto-recrutamento.png.asset.json";
import projetoSolucoesRh from "@/assets/projeto-solucoes-rh.png.asset.json";
import {
  ContainerScroll,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from "@/components/ui/animated-gallery";
import { Button } from "@/components/ui/button";
import { ExpandableGallery } from "@/components/ui/gallery-animation";
import GlyphPortal from "@/components/ui/glyph-portal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KO Systems | Software sob medida" },
      {
        name: "description",
        content: "Criamos sistemas, plataformas e softwares personalizados que aceleram empresas.",
      },
      { property: "og:title", content: "KO Systems | Software sob medida" },
      { property: "og:description", content: "Tecnologia pensada para o seu negócio crescer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const services = [
  {
    title: "Software sob medida",
    text: "Soluções desenhadas em torno dos seus processos, sem atalhos ou limitações de ferramentas prontas.",
    image: serviceSistemas,
    alt: "Painel de um sistema empresarial personalizado",
  },
  {
    title: "Sistemas empresariais",
    text: "Operações conectadas em plataformas rápidas, claras e preparadas para evoluir com a empresa.",
    image: serviceEvolucao,
    alt: "Especialista acompanhando a operação de sistemas empresariais",
  },
  {
    title: "Aplicações web e mobile",
    text: "Experiências digitais consistentes para sua equipe e seus clientes, em qualquer dispositivo.",
    image: serviceWebMobile,
    alt: "Equipe desenvolvendo aplicações para web e celular",
  },
  {
    title: "Integrações e dados",
    text: "Sistemas que conversam entre si e transformam informação dispersa em decisões seguras.",
    image: serviceIntegracoes,
    alt: "Ambiente digital com dados e sistemas integrados",
  },
];

const projects = [
  {
    type: "Telecomunicações",
    title: "Gestão de linhas e dispositivos",
    text: "Controle centralizado de números, aparelhos e restrições para uma operação mais segura.",
    image: projetoGestaoLinhas.url,
    alt: "Painel de gestão de números, dispositivos e restrições",
  },
  {
    type: "Alimentação",
    title: "PDV para restaurante",
    text: "Vendas, comandas e atendimento reunidos em uma experiência rápida para a equipe.",
    image: projetoPdvRestaurante.url,
    alt: "Sistema de ponto de venda e gestão de comandas para restaurante",
  },
  {
    type: "Varejo",
    title: "Gestão de produtos artesanais",
    text: "Estoque, produção, produtos e vendas acompanhados em um único painel.",
    image: projetoGestaoArtesanal.url,
    alt: "Painel de estoque, produção, produtos e vendas",
  },
  {
    type: "Recursos Humanos",
    title: "Captação via WhatsApp",
    text: "Uma jornada direta de contratação, conectando formulários e atendimento pelo WhatsApp.",
    image: projetoRecrutamento.url,
    alt: "Formulário de contratação integrado ao WhatsApp",
  },
  {
    type: "Serviços",
    title: "Catálogo de soluções",
    text: "Apresentação digital clara para facilitar a descoberta e a contratação de serviços.",
    image: projetoSolucoesRh.url,
    alt: "Catálogo digital de serviços de recursos humanos",
  },
];

type GalleryEntry = {
  title: string;
  text: string;
  image: string;
  alt: string;
  type?: string;
};

function distributeEntries(entries: GalleryEntry[]) {
  return [
    entries.filter((_, index) => index % 3 === 0),
    entries.filter((_, index) => index % 3 === 1),
    entries.filter((_, index) => index % 3 === 2),
  ];
}

function AnimatedGallery({ entries, dark = false }: { entries: GalleryEntry[]; dark?: boolean }) {
  const columns = distributeEntries(entries);
  const yRanges = [
    ["0%", "-12%"],
    ["15%", "5%"],
    ["-10%", "2%"],
  ];

  return (
    <ContainerScroll className="mt-10 md:mt-16">
      <ContainerSticky>
        <GalleryContainer className="mx-auto max-w-7xl">
          {columns.map((column, columnIndex) => (
            <GalleryCol
              key={columnIndex}
              className={columnIndex === 1 ? "mt-[-36%]" : columnIndex === 2 ? "-mt-2" : ""}
              yRange={yRanges[columnIndex] ?? ["0%", "-10%"]}
            >
              {column.map((entry) => (
                <article
                  key={entry.title}
                  className={
                    dark
                      ? "overflow-hidden rounded-md bg-background text-foreground shadow-2xl"
                      : "overflow-hidden rounded-md bg-card text-card-foreground shadow-xl ring-1 ring-border"
                  }
                >
                  <img
                    src={entry.image}
                    alt={entry.alt}
                    width={1200}
                    height={912}
                    loading="lazy"
                    className={
                      dark
                        ? "aspect-[4/3] w-full object-contain"
                        : "aspect-[4/3] w-full object-cover"
                    }
                  />
                  <div className="p-3 md:p-5">
                    {entry.type ? (
                      <p className="hidden text-xs font-bold uppercase tracking-widest text-accent md:block">
                        {entry.type}
                      </p>
                    ) : null}
                    <h3 className="text-sm font-semibold leading-snug md:mt-2 md:text-xl">
                      {entry.title}
                    </h3>
                    <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground md:block">
                      {entry.text}
                    </p>
                  </div>
                </article>
              ))}
            </GalleryCol>
          ))}
        </GalleryContainer>
      </ContainerSticky>
    </ContainerScroll>
  );
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsappUrl =
    "https://wa.me/5511930086602?text=Ol%C3%A1%2C%20KO%20Systems!%20Gostaria%20de%20conversar%20sobre%20um%20projeto.";
  return (
    <main>
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-end px-5 py-5 md:justify-between md:px-10">
          <div className="hidden items-center gap-8 text-sm font-semibold text-foreground md:flex">
            <a href="#projetos" className="transition-opacity hover:opacity-70">
              Projetos
            </a>
            <a href="#servicos" className="transition-opacity hover:opacity-70">
              Serviços
            </a>
          </div>
          <div className="hidden items-center gap-8 text-sm font-semibold text-foreground md:flex">
            <a href="#processo" className="transition-opacity hover:opacity-70">
              Processo
            </a>
            <Button asChild variant="secondary">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                Fale conosco <ArrowRight />
              </a>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </nav>
        {menuOpen && (
          <div className="mx-5 grid gap-3 rounded-lg bg-background p-5 shadow-xl md:hidden">
            <a href="#projetos">Projetos</a>
            <a href="#servicos">Serviços</a>
            <a href="#processo">Processo</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Fale conosco
            </a>
          </div>
        )}
      </header>

      <div id="inicio">
        <GlyphPortal
          word="SYSTEMS"
          focusChar="S"
          brandImage={heroLogoAsset.url}
          scrollLength={2.4}
          fontFamily='"Sora", "Arial Black", sans-serif'
          fontWeight={700}
          enterLabel="Conheça a KO"
          style={{
            "--gp-paper": "var(--color-background)",
            "--gp-ink": "var(--color-primary)",
            "--gp-field": "var(--color-primary)",
            "--gp-foreground": "var(--color-primary-foreground)",
          }}
        >
          <div className="mx-auto w-full max-w-7xl">
            <p className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent">
              <span className="h-px w-10 bg-accent" /> KO Systems
            </p>
            <h1 className="max-w-5xl text-balance text-5xl font-semibold leading-[1.08] md:text-7xl lg:text-8xl">
              Software pensado para o seu negócio avançar.
            </h1>
            <div className="mt-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
              <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/70">
                Criamos sistemas personalizados que simplificam operações, conectam pessoas e
                transformam desafios reais em crescimento.
              </p>
              <Button asChild variant="secondary" size="lg">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  Começar um projeto <ArrowRight />
                </a>
              </Button>
            </div>
          </div>
        </GlyphPortal>
      </div>

      <section id="projetos" className="bg-primary py-24 text-primary-foreground md:py-32">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            Projetos selecionados
          </p>
          <h2 className="mt-5 max-w-4xl text-balance text-4xl font-semibold md:text-6xl">
            Produtos digitais que geram impacto mensurável.
          </h2>
          <p className="mt-6 max-w-2xl text-primary-foreground/70">
            Sistemas reais criados para operações, vendas, gestão e atendimento.
          </p>
        </div>
        <div className="mx-auto mt-12 max-w-7xl px-5 md:mt-16 md:px-10">
          <ExpandableGallery
            images={projects.map((project) => ({
              src: project.image,
              alt: project.alt,
              title: project.title,
              eyebrow: project.type,
              description: project.text,
            }))}
          />
        </div>
      </section>

      <section id="servicos" className="px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-border pb-14 md:grid-cols-[1fr_2fr]">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">
              O que construímos
            </p>
            <h2 className="text-balance text-4xl font-semibold leading-tight md:text-6xl">
              Tecnologia sob medida. Sem complexidade desnecessária.
            </h2>
          </div>
        </div>
        <AnimatedGallery entries={services} />
      </section>

      <section id="processo" className="px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            Como trabalhamos
          </p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              [
                "01",
                "Entender",
                "Mergulhamos no negócio, nas pessoas e no problema antes de escrever qualquer linha de código.",
              ],
              [
                "02",
                "Construir",
                "Desenhamos e desenvolvemos em ciclos curtos, com clareza e validação constante.",
              ],
              [
                "03",
                "Evoluir",
                "Colocamos no ar, medimos resultados e seguimos aprimorando o produto junto com você.",
              ],
            ].map(([number, title, text]) => (
              <div key={number} className="border-t border-border pt-6">
                <span className="text-sm font-bold text-accent">{number}</span>
                <h3 className="mt-10 text-3xl font-semibold">{title}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contato"
        className="bg-accent px-5 py-24 text-accent-foreground md:px-10 md:py-32"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest">
              Seu próximo sistema começa aqui
            </p>
            <h2 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-tight md:text-7xl">
              Vamos transformar sua ideia em software?
            </h2>
          </div>
          <Button asChild size="lg">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Iniciar conversa <ArrowRight />
            </a>
          </Button>
        </div>
      </section>

      <footer className="bg-primary px-5 py-10 text-primary-foreground md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-primary-foreground/20 pt-8 text-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={heroLogoAsset.url} alt="KO Systems" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-display font-bold tracking-widest">KO SYSTEMS</p>
              <p className="mt-1 text-xs text-primary-foreground/60">CNPJ 69.208.733/0001-12</p>
            </div>
          </div>
          <p className="text-primary-foreground/60">© 2026 KO Systems</p>
        </div>
      </footer>
    </main>
  );
}
