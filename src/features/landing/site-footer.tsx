import { Github, Instagram, Linkedin } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { buildWhatsAppUrl } from "./contact";
import { company } from "./content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <BrandMark surface="dark" className="footer-logo" />
        <p>Sistemas e softwares personalizados para operações que querem trabalhar melhor.</p>
        <div className="footer-social" aria-label="Redes sociais e contato">
          <a href={company.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram aria-hidden="true" />
          </a>
          <a href={company.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <Linkedin aria-hidden="true" />
          </a>
          <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" aria-label="WhatsApp">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4.1Z" />
              <path d="m8.1 7.4 1.3-.2 1.1 2.5-1 1c.7 1.5 1.8 2.6 3.3 3.3l1-1 2.5 1.1-.2 1.3c-.2 1.1-1.4 1.5-2.4 1.2-3.8-1.1-6.1-3.4-7.2-7.2-.3-1 .1-2.2 1.2-2.4Z" />
            </svg>
          </a>
          <a href={company.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github aria-hidden="true" />
          </a>
        </div>
        <div className="footer-institutional">
          <a href="/sobre">Sobre mim</a>
          <p>
            CNPJ <span>{company.cnpj}</span>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} KO Systems</span>
      </div>
    </footer>
  );
}
