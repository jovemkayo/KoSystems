// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ContactSection } from "./contact-section";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([false, true])("volta à hero respeitando movimento reduzido: %s", (reduced) => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
  vi.stubGlobal("scrollY", 8000);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(<ContactSection />);
  fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
  if (!reduced) {
    act(() => frames.shift()!(0));
    act(() => frames.shift()!(400));
    const middle = (scroll.mock.lastCall?.[0] as ScrollToOptions).top!;
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(8000);
    act(() => frames.shift()!(1000));
  }
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "instant" });
});
