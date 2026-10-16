// @vitest-environment jsdom
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import GlyphPortal from "./glyph-portal";

it("mantém o conteúdo revelado oculto no primeiro HTML, antes de iniciar o zoom", () => {
  const host = document.createElement("div");
  host.innerHTML = renderToString(
    <GlyphPortal word="SYSTEMS">
      <h1>Conteúdo após o zoom</h1>
    </GlyphPortal>,
  );
  document.body.append(host);
  try {
    const content = host.querySelector<HTMLElement>("[data-gp-content]")!;
    expect(getComputedStyle(content).opacity).toBe("0");
    expect(getComputedStyle(host.querySelector<HTMLElement>("[data-gp-field]")!).visibility).toBe(
      "hidden",
    );
    expect(getComputedStyle(host.querySelector<HTMLElement>("[data-gp-pin]")!).position).toBe(
      "sticky",
    );
  } finally {
    host.remove();
  }
});
