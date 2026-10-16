import { describe, expect, it } from "vitest";

import { processSteps, projects, services } from "./content";

describe("conteúdo público", () => {
  it("expõe apenas os três projetos selecionados e demonstrações locais", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "pdv-restaurante",
      "gestao-integrada",
      "orderworkbench",
    ]);
    expect(projects.map((project) => project.clientName)).toEqual([
      "Estalagem Restaurante",
      "Lavandine",
      "OrderWorkbench",
    ]);
    expect(projects.every((project) => project.demoPath.startsWith("/demos/"))).toBe(true);
  });

  it("mantém a oferta e o processo definidos", () => {
    expect(services).toHaveLength(5);
    expect(processSteps.map((step) => step.title)).toEqual([
      "Definir o que precisa mudar",
      "Conferir as telas antes de construir",
      "Testar com sua rotina",
      "Colocar em uso e combinar o suporte",
    ]);
  });
});
