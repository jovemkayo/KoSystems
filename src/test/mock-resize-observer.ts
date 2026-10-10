import { vi } from "vitest";

// jsdom does not calculate layout. Geometry-dependent tests provide explicit bounds.
export function mockResizeObserver() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
}
