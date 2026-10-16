import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, X } from "lucide-react";
import { Testimonial } from "@/components/ui/testimonial";

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
          <h2 id="projects-title">
            O trabalho da sua equipe não precisa depender de controles espalhados.
          </h2>
        </header>

        <div className="project-grid">
          {projects.map((project) => {
            return (
              <article
                className="project-case"
                key={project.slug}
                aria-labelledby={`${project.slug}-title`}
              >
                <div className="project-case-brand">
                  {project.previewLogo && (
                    <img
                      src={project.previewLogo}
                      alt={project.clientName}
                      loading="lazy"
                      width="260"
                      height="200"
                    />
                  )}
                </div>
                <div className="project-case-copy">
                  <h3 id={`${project.slug}-title`}>{project.headline}</h3>
                  <p className="project-case-summary">{project.summary}</p>
                  <Testimonial {...project.testimonial} />
                  <button
                    key={project.slug}
                    type="button"
                    className="project-case-open"
                    aria-label={`Abrir demonstração interativa de ${project.clientName} · ${project.shortTitle}`}
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setDemoRevision(0);
                      setSelectedSlug(project.slug);
                    }}
                  >
                    Abrir demonstração interativa
                  </button>
                </div>
              </article>
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
                <div className="project-modal-heading">
                  <Dialog.Title>{selected.clientName}</Dialog.Title>
                  <Dialog.Description className="project-modal-context">
                    Demonstração interativa · Dados fictícios
                  </Dialog.Description>
                </div>
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
              <div className="original-project-body">
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
