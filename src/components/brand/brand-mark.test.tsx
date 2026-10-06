// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "./brand-mark";

describe("BrandMark", () => {
  it("seleciona a assinatura correta para cada superfície", () => {
    const { rerender } = render(<BrandMark surface="light" format="lockup" />);
    expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
      "src",
      "/brand/ko-systems-navy.png",
    );

    rerender(<BrandMark surface="dark" format="lockup" />);
    expect(screen.getByRole("img", { name: "KO Systems" })).toHaveAttribute(
      "src",
      "/brand/ko-systems-light.jpg",
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
