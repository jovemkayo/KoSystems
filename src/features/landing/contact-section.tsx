import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { buildWhatsAppUrl } from "./contact";

export function ContactSection() {
  return (
    <section id="contato" className="contact-section" aria-labelledby="contact-title">
      <div className="contact-orbit" aria-hidden="true">
        <BrandMark surface="light" format="symbol" className="contact-symbol" />
      </div>
      <div className="contact-copy">
        <h2 id="contact-title">Solicitar um orçamento</h2>
        <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">
          Solicitar orçamento no WhatsApp <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
