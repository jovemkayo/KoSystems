import { ArrowRight } from "lucide-react";

import GlyphPortal from "@/components/ui/glyph-portal";
import { buildWhatsAppUrl } from "./contact";
import { ContactSection } from "./contact-section";
import { projects } from "./content";
import { ProcessSection } from "./process-section";
import { ProjectShowcase } from "./project-showcase";
import { ServicesSection } from "./services-section";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LandingPage() {
  return (
    <main id="inicio" className="landing-page" tabIndex={-1}>
      <SiteHeader />
      <GlyphPortal
        word="SYSTEMS"
        focusChar="S"
        brandImage="/favicon.png"
        scrollLength={2}
        fontFamily={'"Sora", "Arial Black", sans-serif'}
        fontWeight={700}
        minimalCaption
        style={{
          "--gp-paper": "var(--color-background)",
          "--gp-ink": "var(--color-primary)",
          "--gp-field": "var(--color-primary)",
          "--gp-foreground": "var(--color-primary-foreground)",
        }}
      >
        <div className="hero-reveal">
          <h1>Menos planilhas para preencher. Mais tempo para cuidar da sua empresa.</h1>
          <div className="hero-reveal-bottom">
            <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">
              Solicitar orçamento <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </GlyphPortal>
      <ProjectShowcase projects={projects} />
      <ProcessSection />
      <ServicesSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}
