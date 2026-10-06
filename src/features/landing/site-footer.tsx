import { ArrowUpRight } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { buildWhatsAppUrl } from "./contact";
import { company } from "./content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <BrandMark surface="dark" className="footer-logo" />
        <p>Sistemas e softwares personalizados para operações que querem trabalhar melhor.</p>
      </div>
      <div className="footer-links">
        <div><span>Navegação</span><a href="#projetos">Projetos</a><a href="#servicos">Serviços</a><a href="#processo">Processo</a></div>
        <div><span>Contato</span><a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight /></a><a href={company.instagramUrl} target="_blank" rel="noreferrer">{company.instagramHandle}</a></div>
        <div><span>Institucional</span><a href="/privacidade">Privacidade</a><p>CNPJ <span>{company.cnpj}</span></p></div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} KO Systems</span>
        <span>{company.domain}</span>
        <span>Atendimento remoto</span>
      </div>
    </footer>
  );
}
