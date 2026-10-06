import { describe, expect, it } from "vitest";

import { processSteps, projects, services } from "./content";

describe("conteúdo público", () => {
  it("expõe apenas os quatro casos aprovados e anonimizados", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "pdv-restaurante",
      "gestao-integrada",
      "leitor-pedidos",
      "gestao-linhas",
    ]);
    expect(projects.every((project) => !("clientName" in project))).toBe(true);
  });

  it("mantém a oferta e o processo definidos", () => {
    expect(services).toHaveLength(5);
    expect(processSteps.map((step) => step.title)).toEqual([
      "Entender",
      "Desenhar",
      "Construir",
      "Publicar e evoluir",
    ]);
  });
});
