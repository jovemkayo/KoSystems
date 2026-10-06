import { processSteps } from "./content";

export function ProcessSection() {
  return (
    <section
      id="processo"
      className="section-shell process-section"
      aria-labelledby="process-title"
    >
      <header className="section-heading">
        <span className="eyebrow">Como trabalhamos</span>
        <h2 id="process-title">Do problema à solução em operação.</h2>
      </header>
      <ol className="process-grid">
        {processSteps.map((step) => (
          <li key={step.number}>
            <span>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
