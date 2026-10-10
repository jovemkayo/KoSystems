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

it.each([
  [800, 680, 1200, 420],
  [844, 662.4, 1156, 415.6],
  [667, 733.2, 1333, 433.3],
])(
  "moves focus forward and backward with page scrolling at viewport height %i",
  async (viewportHeight, midpoint, end, firstStep) => {
    let offset = 0;
    vi.stubGlobal("innerHeight", viewportHeight);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", window.clearTimeout.bind(window));
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains("services-section")) {
        return {
          top: -offset,
          bottom: 2000 - offset,
          height: 2000,
          left: 0,
          right: 600,
          width: 600,
          x: 0,
          y: -offset,
          toJSON() {},
        };
      }
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
      const top = this.classList.contains("services-track") ? 0 : 220 + index * 240;
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
    const rows = container.querySelectorAll("article");
    expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
      rows[0],
    ]);

    // Once the panel enters completely, give it a short stationary reading
    // interval before the next page scroll starts moving the wheel.
    offset = 80;
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => window.setTimeout(resolve, 20));
    });
    expect((rows[0] as HTMLElement).style.getPropertyValue("--service-y")).toBe("0px");

    offset = midpoint;
    act(() => window.dispatchEvent(new Event("scroll")));
    await waitFor(() => {
      expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
        rows[2],
      ]);
    });
    expect(
      Number((rows[1] as HTMLElement).style.getPropertyValue("--service-angle").replace("deg", "")),
    ).toBeGreaterThan(0);
    expect(
      Number((rows[3] as HTMLElement).style.getPropertyValue("--service-angle").replace("deg", "")),
    ).toBeLessThan(0);

    offset = end;
    act(() => window.dispatchEvent(new Event("scroll")));
    await waitFor(() => {
      expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
        rows[4],
      ]);
    });

    offset = firstStep;
    act(() => window.dispatchEvent(new Event("scroll")));
    await waitFor(() => {
      expect([...rows].filter((row) => row.getAttribute("data-focused") === "true")).toEqual([
        rows[1],
      ]);
    });
  },
);
