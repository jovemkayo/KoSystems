// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/glyph-portal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

import { LandingPage } from "./landing-page";
import { mockResizeObserver } from "@/test/mock-resize-observer";

beforeEach(mockResizeObserver);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("LandingPage", () => {
  it("reúne a jornada comercial completa sem canais inativos", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const name of ["PDV restaurante", "Gestão integrada", "OrderWorkbench"]) {
      expect(screen.getByRole("button", { name: new RegExp(name, "i") })).toBeVisible();
    }
    expect(
      screen.getByRole("heading", { name: "Estoque e financeiro no mesmo lugar" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Colocar em uso e combinar o suporte" }),
    ).toBeVisible();
    expect(screen.getAllByRole("link", { name: /orçamento/i }).length).toBeGreaterThan(1);
    expect(screen.getByRole("img", { name: "KO Systems" })).toBeVisible();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /e-mail/i })).not.toBeInTheDocument();
  });
});
