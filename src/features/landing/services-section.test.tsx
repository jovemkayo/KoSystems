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
  "moves continuously through intermediate services with a straight focused item at height %i",
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
    await scrollTo(50);
    centered(0);
    for (const index of [1, 2, 3]) {
      // Hand-selected samples around each intermediate service. Unlike a
      // reading plateau, another page scroll must change its vertical offset.
      const sample = [0, 500, 900, 1300][index]!;
      await scrollTo(sample);
      expect(rows[index]!.getAttribute("data-focused")).toBe("true");
      expect(rows[index]!.style.getPropertyValue("--service-angle")).toBe("0deg");
      const previousY = rows[index]!.style.getPropertyValue("--service-y");
      await scrollTo(sample + 20);
      expect(rows[index]!.getAttribute("data-focused")).toBe("true");
      expect(rows[index]!.style.getPropertyValue("--service-y")).not.toBe(previousY);
      expect(rows[index]!.style.getPropertyValue("--service-angle")).toBe("0deg");
    }
    await scrollTo(1100);
    expect(parseFloat(rows[2]!.style.getPropertyValue("--service-y"))).toBeLessThan(0);
    expect(parseFloat(rows[3]!.style.getPropertyValue("--service-y"))).toBeGreaterThan(0);
    await scrollTo(50);
    centered(0);
    await scrollTo(-100);
    centered(0);
    await scrollTo(2000);
    centered(4);
  },
);
