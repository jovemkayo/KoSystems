import { describe, expect, it } from "vitest";

import { processSteps, projects, services } from "./content";

describe("conteúdo público", () => {
  it("expõe apenas os quatro clientes autorizados e demonstrações locais", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "pdv-restaurante",
      "gestao-integrada",
      "leitor-pedidos",
      "gestao-linhas",
    ]);
    expect(projects.map((project) => project.clientName)).toEqual([
      "Estalagem Restaurante",
      "Lavandine",
      "Macaúba Hortifruti",
      "Reference",
    ]);
    expect(projects.every((project) => project.demoPath.startsWith("/demos/"))).toBe(true);
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
