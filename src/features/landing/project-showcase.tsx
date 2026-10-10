import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, RotateCcw, X } from "lucide-react";

import type { ProjectCase } from "./content";

export function ProjectShowcase({ projects }: { projects: readonly ProjectCase[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const selected = projects.find((project) => project.slug === selectedSlug);
  const opener = useRef<HTMLButtonElement>(null);
  const [demoRevision, setDemoRevision] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
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
          <h2 id="projects-title">Projetos que já saíram do papel</h2>
          <p>Demonstrações interativas de alguns projetos desenvolvidos pela KO Systems.</p>
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
                  setStoryOpen(false);
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
                <span className="project-card-copy">
                  <span className="project-segment">{project.segment}</span>
                  <strong>{project.clientName}</strong>
                  <span className="project-card-system">{project.shortTitle}</span>
                  <span>{project.summary}</span>
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
                <span className="project-modal-context">
                  Demonstração interativa · Dados fictícios
                </span>
                <span className="project-modal-mobile-title" aria-hidden="true">
                  {selected.clientName}
                  <small>Dados fictícios</small>
                </span>
                <button
                  type="button"
                  className="project-demo-reset"
                  aria-label="Reiniciar demonstração"
                  title="Reiniciar demonstração"
                  onClick={() => setDemoRevision((revision) => revision + 1)}
                >
                  <RotateCcw aria-hidden="true" /> <span>Reiniciar demonstração</span>
                </button>
                <Dialog.Close className="project-modal-close" aria-label="Fechar projeto">
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="original-project-summary">
                <Dialog.Title>{selected.clientName}</Dialog.Title>
                <Dialog.Description>Explore as telas</Dialog.Description>
              </div>
              <div className="original-project-body">
                <button
                  type="button"
                  id="project-story-toggle"
                  className="project-story-toggle"
                  aria-expanded={storyOpen}
                  aria-controls="project-story-panel"
                  onClick={() => setStoryOpen((open) => !open)}
                >
                  Conheça a solução <ChevronDown aria-hidden="true" />
                </button>
                <div className="original-project-story" data-open={storyOpen}>
                  <div className="project-story-clip">
                    <section
                      id="project-story-panel"
                      aria-labelledby="project-story-toggle"
                      aria-hidden={!storyOpen}
                      inert={!storyOpen}
                      className="project-story"
                    >
                      <h3>{selected.title}</h3>
                      <div className="story-block">
                        <span>O desafio</span>
                        <p>{selected.problem}</p>
                      </div>
                      <div className="story-block">
                        <span>A solução</span>
                        <p>{selected.solution}</p>
                      </div>
                    </section>
                  </div>
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
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </section>
    </Dialog.Root>
  );
}
