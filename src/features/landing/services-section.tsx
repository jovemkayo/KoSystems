import { ArrowUpRight } from "lucide-react";
import { services } from "./content";

export function ServicesSection() {
  return (
    <section
      id="servicos"
      className="section-shell services-section"
      aria-labelledby="services-title"
    >
      <header className="section-heading split-heading">
        <span className="eyebrow">O que construímos</span>
        <div>
          <h2 id="services-title">Tecnologia aplicada ao jeito que sua empresa trabalha.</h2>
          <p>Da primeira ideia à evolução contínua, cada solução nasce do contexto da operação.</p>
        </div>
      </header>
      <div className="services-list">
        {services.map((service) => (
          <article key={service.number} className="service-row">
            <span>{service.number}</span>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <ArrowUpRight aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
