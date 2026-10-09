// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ContactSection } from "./contact-section";
import { ProcessSection } from "./process-section";
import { ServicesSection } from "./services-section";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

afterEach(cleanup);

describe("seções institucionais", () => {
  it("oferece navegação e contato direto", () => {
    render(<SiteHeader />);
    for (const label of ["Projetos", "Serviços", "Processo", "Contato"]) {
      expect(screen.getByRole("link", { name: label })).toBeVisible();
    }
  });

  it("mostra os cinco serviços e as quatro etapas em ordem", () => {
    const { rerender } = render(<ServicesSection />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);
    rerender(<ProcessSection />);
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Entender", "Desenhar", "Construir", "Publicar e evoluir"]);
  });

  it("mantém apenas canais institucionais ativos", () => {
    render(
      <>
        <ContactSection />
        <SiteFooter />
      </>,
    );
    expect(screen.getByText("69.208.733/0001-12")).toBeVisible();
    expect(screen.getByRole("link", { name: "@ko.systems" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /e-mail|github/i })).not.toBeInTheDocument();
  });
});
