// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/glyph-portal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

import { LandingPage } from "./landing-page";

afterEach(cleanup);

describe("LandingPage", () => {
  it("reúne a jornada comercial completa sem canais inativos", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const name of [
      "PDV restaurante",
      "Gestão integrada",
      "Leitor de pedidos",
      "Gestão de linhas",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(name, "i") })).toBeVisible();
    }
    expect(screen.getByRole("heading", { name: "Sistemas de gestão e operação" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Publicar e evoluir" })).toBeVisible();
    expect(screen.getAllByRole("link", { name: /orçamento/i }).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("img", { name: "KO Systems" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /e-mail|github/i })).not.toBeInTheDocument();
  });
});
