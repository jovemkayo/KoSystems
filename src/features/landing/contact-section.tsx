import { ArrowUpRight } from "lucide-react";
import { buildWhatsAppUrl } from "./contact";

export function ContactSection() {
  return (
    <section id="contato" className="contact-section" aria-labelledby="contact-title">
      <div className="contact-orbit" aria-hidden="true">
        <span>KO</span>
      </div>
      <div className="contact-copy">
        <span className="eyebrow">Vamos conversar</span>
        <h2 id="contact-title">Tem um problema para resolver ou uma ideia para tirar do papel?</h2>
        <p>Conte um pouco do cenário. A conversa começa pelo negócio, não pela tecnologia.</p>
        <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer">
          Solicitar orçamento no WhatsApp <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
