import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, X } from "lucide-react";

import type { ProjectCase } from "./content";

export function ProjectShowcase({ projects }: { projects: readonly ProjectCase[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const selected = projects.find((project) => project.slug === selectedSlug);
  const opener = useRef<HTMLButtonElement>(null);
  const [demoRevision, setDemoRevision] = useState(0);
  if (!projects.length) return null;

  return (
    <Dialog.Root
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) setSelectedSlug(undefined);
      }}
    >
      <section
        id="projetos"
        className="section-shell projects-section"
        aria-labelledby="projects-title"
      >
        <header className="section-heading">
          <h2 id="projects-title">Sistemas que resolvem o trabalho real.</h2>
        </header>

        <div className="project-grid">
          {projects.map((project) => {
            return (
              <button
                key={project.slug}
                type="button"
                className="project-card"
                aria-label={`${project.clientName} · ${project.shortTitle}`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setDemoRevision(0);
                  setSelectedSlug(project.slug);
                }}
              >
                <span className="project-preview" aria-hidden="true">
                  {project.previewLogo ? (
                    <img
                      className="project-client-logo"
                      src={project.previewLogo}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="project-client-wordmark">{project.clientName}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {selected ? (
          <Dialog.Portal>
            <Dialog.Overlay className="project-modal-overlay" />
            <Dialog.Content
              className="project-modal project-modal-original"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                opener.current?.focus();
              }}
            >
              <div className="project-modal-bar">
                <span>Demonstração interativa · Dados fictícios</span>
                <button
                  type="button"
                  className="project-demo-reset"
                  onClick={() => setDemoRevision((revision) => revision + 1)}
                >
                  <RotateCcw aria-hidden="true" /> Reiniciar demonstração
                </button>
                <Dialog.Close className="project-modal-close" aria-label="Fechar projeto">
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="original-project-summary">
                <Dialog.Title>{selected.clientName}</Dialog.Title>
                <Dialog.Description>
                  {selected.title}. Explore as telas originais com dados fictícios.
                </Dialog.Description>
              </div>
              <iframe
                key={`${selected.slug}-${demoRevision}`}
                className="original-project-frame"
                src={selected.demoPath}
                title={`Demonstração de ${selected.clientName}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              <details className="original-project-story">
                <summary>Conheça a solução</summary>
                <div className="project-detail">
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
                </div>
              </details>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </section>
    </Dialog.Root>
  );
}
