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
    for (const label of ["Projetos", "Serviços", "Contato"]) {
      expect(screen.getByRole("link", { name: label })).toBeVisible();
    }
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Projetos",
      "Serviços",
      "Contato",
    ]);
    expect(screen.getByRole("link", { name: "Serviços" })).toHaveAttribute("href", "#processo");
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
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://www.instagram.com/ko.systems/",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/kayo-de-oliveira-marques-2a2b21325/",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/jovemkayo",
    );
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5511930086602"),
    );
    expect(screen.queryByRole("link", { name: "Sobre mim" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Tem um problema para resolver ou uma ideia para tirar do papel?",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Solicitar orçamento" })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5511930086602"),
    );
  });
});
