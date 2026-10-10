// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ServicesSection } from "./services-section";
import { mockResizeObserver } from "@/test/mock-resize-observer";

// jsdom has no layout observer; geometry is supplied explicitly in the scroll test.
beforeEach(mockResizeObserver);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("moves the single focused service within the list when its internal viewport scrolls", async () => {
  let offset = 0;
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", window.clearTimeout.bind(window));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.classList.contains("services-list")) {
      return {
        top: 100,
        bottom: 500,
        height: 400,
        left: 0,
        right: 600,
        width: 600,
        x: 0,
        y: 100,
        toJSON() {},
      };
    }
    const index = Number(this.getAttribute("data-service-index"));
    const top = 220 + index * 240 - offset;
    return {
      top,
      bottom: top + 120,
      height: 120,
      left: 0,
      right: 600,
      width: 600,
      x: 0,
      y: top,
      toJSON() {},
    };
  });
  const { container } = render(<ServicesSection />);
  const list = container.querySelector(".services-list")!;
  const rows = container.querySelectorAll("article");
  expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([rows[0]]);

  offset = 240;
  act(() => list.dispatchEvent(new Event("scroll")));
  await waitFor(() => {
    expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
      rows[1],
    ]);
  });

  offset = 960;
  act(() => list.dispatchEvent(new Event("scroll")));
  await waitFor(() => {
    expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
      rows[4],
    ]);
  });
});
