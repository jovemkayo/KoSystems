// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useCompactHeader } from "./use-compact-header";

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: y });
    window.dispatchEvent(new Event("scroll"));
  });
}

it("keeps the compact header stable through scroll anchoring adjustments", () => {
  const { result } = renderHook(useCompactHeader);
  expect(result.current).toBe(false);
  scrollTo(180);
  expect(result.current).toBe(true);
  scrollTo(119);
  expect(result.current).toBe(true);
  scrollTo(180);
  expect(result.current).toBe(true);
});

it("keeps the full header available near the top", () => {
  const { result } = renderHook(useCompactHeader);
  scrollTo(180);
  expect(result.current).toBe(true);
  scrollTo(0);
  scrollTo(25);
  expect(result.current).toBe(false);
});
