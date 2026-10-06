import { useState } from "react";
import { ArrowDownRight, Check, FileText, ShoppingCart, Smartphone } from "lucide-react";

import type { ProjectCase } from "./content";
import { ProjectDemo } from "./demos/project-demo";

const previewIcons = [ShoppingCart, Check, FileText, Smartphone] as const;

export function ProjectShowcase({ projects }: { projects: readonly ProjectCase[] }) {
  const [selectedSlug, setSelectedSlug] = useState(projects[0]?.slug);
  const selected = projects.find((project) => project.slug === selectedSlug) ?? projects[0];
  if (!selected) return null;

  return (
    <section
      id="projetos"
      className="section-shell projects-section"
      aria-labelledby="projects-title"
    >
      <header className="section-heading">
        <span className="eyebrow">Projetos em operação</span>
        <h2 id="projects-title">Sistemas que resolvem o trabalho real.</h2>
        <p>
          Casos reais apresentados sem dados de clientes. Selecione um projeto para conhecer a
          solução.
        </p>
      </header>

      <div className="project-grid">
        {projects.map((project, index) => {
          const Icon = previewIcons[index % previewIcons.length] ?? Check;
          const active = selected.slug === project.slug;
          return (
            <button
              key={project.slug}
              type="button"
              className="project-card"
              aria-pressed={active}
              aria-controls="project-detail"
              onClick={() => setSelectedSlug(project.slug)}
            >
              <span className="project-preview" aria-hidden="true">
                <span className="preview-window-bar">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="preview-icon">
                  <Icon />
                </span>
                <span className="preview-lines">
                  <i />
                  <i />
                  <i />
                </span>
              </span>
              <span className="project-card-copy">
                <span className="project-segment">{project.segment}</span>
                <strong>{project.shortTitle}</strong>
                <span>{project.summary}</span>
              </span>
              <ArrowDownRight className="project-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <article id="project-detail" className="project-detail" aria-live="polite">
        <div className="project-story">
          <span className="eyebrow">{selected.segment}</span>
          <h3>{selected.title}</h3>
          <div className="story-block">
            <span>O desafio</span>
            <p>{selected.problem}</p>
          </div>
          <div className="story-block">
            <span>A solução</span>
            <p>{selected.solution}</p>
          </div>
          <ul>
            {selected.capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </div>
        <div className="project-experience">
          {selected.demoKind ? (
            <ProjectDemo key={selected.slug} kind={selected.demoKind} />
          ) : (
            <div className="case-blueprint">
              <span className="case-blueprint-label">Visão da solução</span>
              <div>
                <Smartphone aria-hidden="true" />
                <strong>Linhas</strong>
                <span>Responsáveis e planos</span>
              </div>
              <div>
                <Check aria-hidden="true" />
                <strong>Dispositivos</strong>
                <span>Inventário atualizado</span>
              </div>
              <div>
                <ArrowDownRight aria-hidden="true" />
                <strong>Histórico</strong>
                <span>Movimentações rastreadas</span>
              </div>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
