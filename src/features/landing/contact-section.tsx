import { ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { buildWhatsAppUrl } from "./contact";
import { BackToTop } from "./back-to-top";

export function ContactSection() {
  return (
    <section id="contato" className="contact-section" aria-labelledby="contact-title">
      <div className="contact-orbit" aria-hidden="true">
        <BrandMark surface="light" format="symbol" className="contact-symbol" />
      </div>
      <div className="contact-copy">
        <h2 id="contact-title">Tem um problema para resolver ou uma ideia para tirar do papel?</h2>
        <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">
          <span>Solicitar orçamento</span>
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <BackToTop />
    </section>
  );
}
