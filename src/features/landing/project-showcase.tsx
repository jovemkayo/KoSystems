import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownRight, Check, FileText, ShoppingCart, Smartphone, X } from "lucide-react";

import type { ProjectCase } from "./content";
import { ProjectDemo } from "./demos/project-demo";

const previewIcons = [ShoppingCart, Check, FileText, Smartphone] as const;

export function ProjectShowcase({ projects }: { projects: readonly ProjectCase[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const selected = projects.find((project) => project.slug === selectedSlug);
  const opener = useRef<HTMLButtonElement>(null);
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
          <p>
            Casos reais apresentados sem dados de clientes. Selecione um projeto para conhecer a
            solução.
          </p>
        </header>

        <div className="project-grid">
          {projects.map((project, index) => {
            const Icon = previewIcons[index % previewIcons.length] ?? Check;
            return (
              <button
                key={project.slug}
                type="button"
                className="project-card"
                aria-haspopup="dialog"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelectedSlug(project.slug);
                }}
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

        {selected ? (
          <Dialog.Portal>
            <Dialog.Overlay className="project-modal-overlay" />
            <Dialog.Content
              className="project-modal"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                opener.current?.focus();
              }}
            >
              <div className="project-modal-bar">
                <span>Demonstração interativa</span>
                <Dialog.Close className="project-modal-close" aria-label="Fechar projeto">
                  <X aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="project-detail">
                <div className="project-story">
                  <span className="eyebrow">{selected.segment}</span>
                  <Dialog.Title asChild>
                    <h3>{selected.title}</h3>
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Explore a demonstração com dados fictícios.
                  </Dialog.Description>
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
                  <ProjectDemo key={selected.slug} kind={selected.demoKind} />
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </section>
    </Dialog.Root>
  );
}
