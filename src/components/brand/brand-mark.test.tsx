// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BrandMark } from "./brand-mark";

afterEach(cleanup);

describe("BrandMark", () => {
  it("reserva espaço para a marca antes de a imagem carregar", () => {
    const { rerender } = render(<BrandMark surface="light" />);
    expect(screen.getByRole("img")).toHaveAttribute("width", "2000");
    expect(screen.getByRole("img")).toHaveAttribute("height", "2000");
    rerender(<BrandMark surface="light" format="symbol" />);
    expect(screen.getByRole("img")).toHaveAttribute("width", "512");
    expect(screen.getByRole("img")).toHaveAttribute("height", "512");
  });
  it("seleciona a assinatura correta para cada superfície", () => {
    const { rerender } = render(<BrandMark surface="light" format="lockup" />);
    expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
      "src",
      "/brand/ko-systems-navy.png",
    );

    rerender(<BrandMark surface="dark" format="lockup" />);
    expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
      "src",
      "/brand/ko-systems-navy.png",
    );
  });

  it("usa o símbolo local sem texto quando solicitado", () => {
    render(<BrandMark surface="dark" format="symbol" />);
    expect(screen.getByRole("img", { name: "Símbolo KO Systems" })).toHaveAttribute(
      "src",
      "/favicon.png",
    );
  });
});
