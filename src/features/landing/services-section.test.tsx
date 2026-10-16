// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ServicesSection } from "./services-section";
import { mockResizeObserver } from "@/test/mock-resize-observer";

beforeEach(mockResizeObserver);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([800, 844, 667])(
  "holds every service centered while scrolling at height %i",
  async (viewportHeight) => {
    let offset = -100;
    const sectionHeight = viewportHeight + 1800;
    vi.stubGlobal("innerHeight", viewportHeight);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", window.clearTimeout.bind(window));
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains("services-sticky") ? viewportHeight : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const section = this.classList.contains("services-section");
      const top = section ? -offset : 0;
      const height = section ? sectionHeight : 400;
      return {
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 600,
        width: 600,
        x: 0,
        y: top,
        toJSON() {},
      };
    });
    const { container } = render(<ServicesSection />);
    const rows = container.querySelectorAll("article");
    const scrollTo = async (next: number) => {
      offset = next;
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        await new Promise((resolve) => window.setTimeout(resolve, 20));
      });
    };
    const centered = (index: number) => {
      expect(rows[index]!.getAttribute("data-focused")).toBe("true");
      expect(rows[index]!.style.getPropertyValue("--service-y")).toBe("0px");
      expect(rows[index]!.style.getPropertyValue("--service-angle")).toBe("0deg");
    };
    centered(0);
    for (const [index, start, end] of [
      [0, 50, 150],
      [1, 450, 550],
      [2, 850, 950],
      [3, 1250, 1350],
      [4, 1650, 1750],
    ] as const) {
      await scrollTo(start);
      centered(index);
      await scrollTo(end);
      centered(index);
    }
    await scrollTo(1100);
    expect(parseFloat(rows[2]!.style.getPropertyValue("--service-y"))).toBeLessThan(0);
    expect(parseFloat(rows[3]!.style.getPropertyValue("--service-y"))).toBeGreaterThan(0);
    await scrollTo(500);
    centered(1);
    await scrollTo(-100);
    centered(0);
    await scrollTo(2000);
    centered(4);
  },
);
