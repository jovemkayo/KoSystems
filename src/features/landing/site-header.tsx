import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { buildWhatsAppUrl } from "./contact";

const links = [
  ["Projetos", "#projetos"],
  ["Serviços", "#servicos"],
  ["Processo", "#processo"],
  ["Contato", "#contato"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="header-brand" href="#inicio" aria-label="KO Systems — início">
        <BrandMark surface="light" className="header-logo" />
      </a>
      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className="desktop-nav" aria-label="Navegação principal">
        {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </nav>
      <a className="header-cta" href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">
        Solicitar orçamento <ArrowUpRight aria-hidden="true" />
      </a>
      {open ? (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Solicitar orçamento <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
      ) : null}
    </header>
  );
}
