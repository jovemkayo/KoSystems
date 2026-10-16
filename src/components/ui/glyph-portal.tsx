"use client";

/**
 * Glyph Portal © 2026 Christian Katzmann. MIT.
 * Origin: UsefulPortal.astro on https://ktzm.dk → UsefulPortal.tsx → ClarityPortal.tsx.
 * A scroll-driven camera through live type. Keep this notice with copies.
 */
import { useId, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type GlyphPortalStyle = CSSProperties & {
  "--gp-paper"?: string;
  "--gp-ink"?: string;
  "--gp-field"?: string;
  "--gp-foreground"?: string;
};

export type GlyphPortalProps = {
  word?: string;
  focusChar?: string;
  interactive?: boolean;
  background?: ReactNode;
  front?: ReactNode;
  brandImage?: string;
  children?: ReactNode;
  scrollLength?: number;
  fontFamily?: string;
  fontWeight?: number;
  annotations?: boolean;
  enterLabel?: string;
  minimalCaption?: boolean;
  className?: string;
  style?: GlyphPortalStyle;
  onProgress?: (progress: number) => void;
};

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const DEFAULT_FONT = '"Arial Black", "Arial", sans-serif';
type Ink = { x: number; y: number; radius: number; index: number };
type Letter = { index: number; x: number; y: number; width: number; height: number };

function interior(
  context: CanvasRenderingContext2D,
  char: string,
  font: string,
): Omit<Ink, "index"> | null {
  const canvas = context.canvas;
  context.font = font;
  const metrics = context.measureText(char);
  const pad = 8;
  const left = Math.ceil(metrics.actualBoundingBoxLeft);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  canvas.width = Math.max(
    1,
    Math.ceil(metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight) + pad * 2,
  );
  canvas.height = Math.max(
    1,
    Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + pad * 2,
  );
  context.font = font;
  context.fontKerning = "none";
  context.fillText(char, pad + left, pad + ascent);
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const rows = new Uint16Array(width + 1);
  let size = 0;
  let bx = 0;
  let by = 0;
  for (let y = 0; y < height; y += 1) {
    let diagonal = 0;
    for (let x = 0; x < width; x += 1) {
      const above = rows[x + 1] ?? 0;
      const leftCell = rows[x] ?? 0;
      const alpha = pixels[(y * width + x) * 4 + 3] ?? 0;
      rows[x + 1] = alpha > 245 ? Math.min(above, leftCell, diagonal) + 1 : 0;
      diagonal = above;
      const cell = rows[x + 1] ?? 0;
      if (cell > size) {
        size = cell;
        bx = x;
        by = y;
      }
    }
  }
  if (size < 3) return null;
  return {
    x: (bx + 1 - size / 2 - pad - left) / 3,
    y: (by + 1 - size / 2 - pad - ascent) / 3,
    radius: (size / 2 - 1) / 3,
  };
}

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (
      /(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY) &&
      parent !== document.body &&
      parent !== document.documentElement
    ) {
      return parent;
    }
  }
  return null;
}

export default function GlyphPortal({
  word = "SUBLIME",
  focusChar,
  interactive = true,
  background,
  front,
  brandImage,
  children,
  scrollLength = 2.4,
  fontFamily = DEFAULT_FONT,
  fontWeight = 900,
  annotations = false,
  enterLabel = "Enter section",
  minimalCaption = false,
  className,
  style,
  onProgress,
}: GlyphPortalProps) {
  const uid = `gp-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const clipId = `${uid}-clip`;
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(onProgress);
  useLayoutEffect(() => {
    progressRef.current = onProgress;
  }, [onProgress]);

  const text = word.trim().normalize("NFC") || "SUBLIME";
  let characterOffset = 0;
  const characters = Array.from(text, (char) => {
    const index = characterOffset;
    characterOffset += char.length;
    return { char, index };
  });
  const length = Number.isFinite(scrollLength) ? clamp(scrollLength, 1, 8) : 2.4;
  const weight = Number.isFinite(fontWeight) ? clamp(fontWeight, 1, 1000) : 900;
  const hasFront = front != null;
  const q = `:where(#${uid})`;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const pin = section.querySelector<HTMLElement>("[data-gp-pin]");
    const field = section.querySelector<HTMLElement>("[data-gp-field]");
    const art = section.querySelector<SVGSVGElement>("[data-gp-art]");
    const clip = section.querySelector<SVGClipPathElement>(`#${clipId}`);
    const glyph = section.querySelector<SVGTextElement>("[data-gp-glyph]");
    const marks = section.querySelector<SVGGElement>("[data-gp-marks]");
    const brand = section.querySelector<SVGImageElement>("[data-gp-brand]");
    const choices = section.querySelector<HTMLElement>("[data-gp-choices]");
    const picker = section.querySelector<HTMLSelectElement>("[data-gp-select]");
    const viewport = section.querySelector<HTMLElement>("[data-gp-viewport]");
    if (
      !pin ||
      !field ||
      !art ||
      !clip ||
      !glyph ||
      !marks ||
      !choices ||
      !picker ||
      !viewport ||
      (brandImage && !brand)
    )
      return;

    const buttons = Array.from(choices.querySelectorAll<HTMLButtonElement>("button"));
    const root = scrollParent(section);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    let disposed = false;
    let raf = 0;
    let dirty = true;
    let active = true;
    let ready = false;
    const mountedAt = performance.now();
    let browserFrameSeen = false;
    let stalled = false;
    let width = 1;
    let height = 1;
    let travel = 1;
    let startScale = 1;
    let endScale = 1;
    let center = { x: 0, y: 0 };
    let target: Ink | null = null;
    let lastProgress = -1;
    let candidates: Ink[] = [];
    let letters: Letter[] = [];
    let choosing = false;
    let bounds = { x: 0, y: 0, width: 1, height: 1 };
    let fontDirty = true;

    glyph.style.fontFamily = fontFamily;
    const computedFamily = getComputedStyle(glyph).fontFamily;
    const families = computedFamily.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g) ?? [];
    const available = families.filter((family) => {
      try {
        return document.fonts.check(`${weight} 100px ${family.trim()}`, text);
      } catch {
        return false;
      }
    });
    glyph.style.fontFamily = [...available, DEFAULT_FONT].join(",");
    stalled = available.length < families.length;

    const readInk = () => {
      if (!context) return false;
      const font = getComputedStyle(glyph);
      const scanFont = `${font.fontWeight} 300px ${font.fontFamily}`;
      context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
      context.fontKerning = "none";
      const metrics = context.measureText(text);
      const advances = Array.from(
        { length: text.length },
        (_, index) => context.measureText(text.slice(0, index)).width,
      );
      bounds = {
        x: -metrics.actualBoundingBoxLeft,
        y: -metrics.actualBoundingBoxAscent,
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
      };
      if (!bounds.width || !bounds.height) return false;
      center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const requested = focusChar ? text.indexOf(focusChar.normalize("NFC")) : -1;
      let offset = 0;
      candidates = [];
      letters = [];
      for (const char of Array.from(text)) {
        context.font = `${font.fontWeight} 100px ${font.fontFamily}`;
        const metricsForChar = context.measureText(char);
        letters.push({
          index: offset,
          x: (advances[offset] ?? 0) - metricsForChar.actualBoundingBoxLeft,
          y: -metricsForChar.actualBoundingBoxAscent,
          width: metricsForChar.actualBoundingBoxLeft + metricsForChar.actualBoundingBoxRight,
          height: metricsForChar.actualBoundingBoxAscent + metricsForChar.actualBoundingBoxDescent,
        });
        const found = interior(context, char, scanFont);
        if (found)
          candidates.push({ ...found, x: found.x + (advances[offset] ?? 0), index: offset });
        offset += char.length;
      }
      target =
        candidates.find((candidate) => candidate.index === requested) ??
        [...candidates].sort(
          (a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x),
        )[0] ??
        null;
      return true;
    };

    const select = (next: Ink | null) => {
      target = next;
      endScale = target
        ? Math.max(startScale, Math.hypot(width, height) / (target.radius * 1.35))
        : startScale;
      section.dataset["gpFocus"] = target ? (Array.from(text.slice(target.index))[0] ?? "") : "";
      section.dataset["gpFocusIndex"] = String(target?.index ?? -1);
      for (const button of buttons) {
        const index = Number(button.dataset["gpLetter"]);
        const selected = index === target?.index;
        button.disabled = !candidates.some((candidate) => candidate.index === index);
        button.setAttribute("aria-checked", String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      if (picker.value !== "") picker.value = String(target?.index ?? -1);
      for (const option of Array.from(picker.options)) {
        option.disabled =
          option.value === "" ||
          !candidates.some((candidate) => candidate.index === Number(option.value));
      }
      const inverseScale = 1 / startScale;
      const y = bounds.y + bounds.height + 25 * inverseScale;
      const x = bounds.x;
      const right = x + bounds.width;
      const cross = target
        ? `M${target.x - 9 * inverseScale} ${target.y}h${18 * inverseScale}M${target.x} ${target.y - 9 * inverseScale}v${18 * inverseScale}`
        : "";
      const annotationPath = marks.querySelector("path");
      annotationPath?.setAttribute(
        "d",
        `M${x} ${y}H${right}M${x} ${y - 5 * inverseScale}v${10 * inverseScale}M${right} ${y - 5 * inverseScale}v${10 * inverseScale}${cross}`,
      );
      annotationPath?.setAttribute("stroke-width", String(inverseScale));
    };

    const position = () => {
      const origin = root ? root.getBoundingClientRect().top + root.clientTop : 0;
      return clamp((origin - section.getBoundingClientRect().top) / travel);
    };

    const paint = (progress: number) => {
      const isStatic = reducedMotion.matches || !browserFrameSeen || stalled || !target;
      const p = isStatic ? 0 : progress;
      const t = clamp(p / 0.78);
      const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
      const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
      const blend =
        endScale === startScale
          ? 0
          : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
      const cx = center.x + ((target?.x ?? center.x) - center.x) * blend;
      const cy = center.y + ((target?.y ?? center.y) - center.y) * blend;
      const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
      const wordCenterY = height * 0.56 + height * 0.04 * eased;
      const transform = `translate(${width / 2} ${wordCenterY}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;
      const radians = (roll * Math.PI) / 180;
      const dx = width / 2 / scale;
      const dy = wordCenterY / scale;
      clip.setAttribute("transform", `scale(${scale}) rotate(${roll})`);
      glyph.setAttribute(
        "transform",
        `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`,
      );
      marks.setAttribute("transform", transform);
      marks.style.opacity = String(1 - smooth(0.015, 0.17, p));
      if (brand) {
        brand.setAttribute("transform", transform);
        brand.style.opacity = String(1 - smooth(0.72, 0.84, p));
      }
      choosing = interactive && !isStatic && p < 0.04;
      choices.inert = !choosing;
      section.dataset["gpChoosing"] = String(choosing);
      field.style.clipPath = t >= 1 ? "none" : `url(#${clipId})`;
      section.style.setProperty("--gp-caption", String(1 - smooth(0.01, 0.16, p)));
      section.style.setProperty("--gp-reveal", String(isStatic ? 1 : smooth(0.78, 0.9, p)));
      section.style.setProperty("--gp-field-scale", String(1 + 0.16 * smooth(0, 0.82, p)));
      section.style.setProperty("--gp-caption-hit", p < 0.08 ? "auto" : "none");
      section.dataset["gpEntered"] = String(p >= 0.9);
      section.dataset["gpProgress"] = p.toFixed(5);
      if (p !== lastProgress) {
        lastProgress = p;
        progressRef.current?.(p);
      }
    };

    const layout = () => {
      if (!section.clientWidth) return;
      width = pin.clientWidth;
      const smallViewport = viewport.offsetHeight;
      const viewportHeight = Math.max(
        1,
        Math.min(root?.clientHeight ?? smallViewport, smallViewport),
      );
      height = reducedMotion.matches ? Math.min(viewportHeight * 0.75, 480) : viewportHeight;
      section.style.setProperty("--gp-height", `${height}px`);
      travel = height * Math.max(1, length - 1);
      art.setAttribute("viewBox", `0 0 ${width} ${height}`);
      if (fontDirty) {
        ready = readInk();
        fontDirty = false;
      }
      if (!ready) return;
      const wordHeight =
        hasFront && height < 480
          ? Math.min(height * 0.38, Math.max(24, height - 264))
          : height * 0.38;
      const displayWidth = Math.min(width * 0.84, 1180);
      const displayHeight = Math.min(wordHeight, 280);
      startScale = Math.min(displayWidth / bounds.width, displayHeight / bounds.height);
      select(target);
      if (brand) {
        const brandSize = bounds.height * 0.7;
        brand.setAttribute("x", String(center.x - brandSize / 2));
        brand.setAttribute("y", String(bounds.y - brandSize - bounds.height * 0.35));
        brand.setAttribute("width", String(brandSize));
        brand.setAttribute("height", String(brandSize));
      }
      for (const button of buttons) {
        const letter = letters.find((item) => item.index === Number(button.dataset["gpLetter"]));
        if (!letter) continue;
        Object.assign(button.style, {
          left: `${width / 2 + (letter.x - center.x) * startScale}px`,
          top: `${height * 0.56 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`,
          width: `${Math.max(1, letter.width * startScale)}px`,
          height: `${Math.max(44, letter.height * startScale)}px`,
        });
      }
      section.style.setProperty(
        "--gp-word-top",
        `${height * 0.56 - (bounds.height * startScale) / 2}px`,
      );
      section.style.setProperty(
        "--gp-word-bottom",
        `${height * 0.56 + (bounds.height * startScale) / 2}px`,
      );
      section.dataset["gpReady"] = "true";
      section.dataset["gpMotion"] =
        !reducedMotion.matches && !browserFrameSeen
          ? "pending"
          : !reducedMotion.matches && !stalled && target
            ? "on"
            : "off";
    };

    const frame = (time?: number) => {
      raf = 0;
      if (disposed) return;
      if (time !== undefined && !browserFrameSeen) {
        browserFrameSeen = true;
        stalled ||= performance.now() - mountedAt > 2500;
        dirty = true;
      }
      if (dirty) {
        dirty = false;
        layout();
      }
      if (ready) paint(position());
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      cancelAnimationFrame(raf);
      dirty = true;
      frame();
    };
    const scroll = () => schedule();
    const choose = (event: Event) => {
      if (!choosing || position() >= 0.04) return;
      const element = event.target instanceof Element ? event.target : null;
      const button = element?.closest<HTMLElement>("[data-gp-letter]");
      const next = candidates.find(
        (candidate) => candidate.index === Number(button?.dataset["gpLetter"]),
      );
      if (!next || next === target) return;
      select(next);
      paint(position());
    };
    const navigate = (event: KeyboardEvent) => {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
      if (!choosing || !keys.includes(event.key) || candidates.length === 0) return;
      event.preventDefault();
      const current = Math.max(0, candidates.indexOf(target as Ink));
      const index =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? candidates.length - 1
            : (current +
                (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) +
                candidates.length) %
              candidates.length;
      const next = candidates[index];
      if (!next) return;
      buttons
        .find((button) => Number(button.dataset["gpLetter"]) === next.index)
        ?.focus({ preventScroll: true });
    };
    const pick = () => {
      if (!choosing || position() >= 0.04) return;
      const next = candidates.find((candidate) => candidate.index === Number(picker.value));
      if (next) {
        select(next);
        paint(position());
      }
    };

    choices.addEventListener("pointerover", choose);
    choices.addEventListener("click", choose);
    choices.addEventListener("focusin", choose);
    choices.addEventListener("keydown", navigate);
    picker.addEventListener("change", pick);
    const observer = new ResizeObserver(resize);
    observer.observe(section);
    if (root) observer.observe(root);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        active = entry?.isIntersecting ?? false;
        if (active) {
          dirty = true;
          schedule();
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { root, rootMargin: "100% 0px" },
    );
    visibility.observe(section);
    (root ?? window).addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    reducedMotion.addEventListener("change", resize);
    frame();
    schedule();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      visibility.disconnect();
      (root ?? window).removeEventListener("scroll", scroll);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      reducedMotion.removeEventListener("change", resize);
      choices.removeEventListener("pointerover", choose);
      choices.removeEventListener("click", choose);
      choices.removeEventListener("focusin", choose);
      choices.removeEventListener("keydown", navigate);
      picker.removeEventListener("change", pick);
    };
  }, [text, focusChar, interactive, fontFamily, weight, length, clipId, hasFront, brandImage]);

  const portalStyle = {
    "--gp-length": length,
    "--gp-characters": characters.length,
    "--gp-paper": "var(--color-background)",
    "--gp-ink": "var(--color-primary)",
    "--gp-field": "var(--color-primary)",
    "--gp-foreground": "var(--color-primary-foreground)",
    ...style,
  } as GlyphPortalStyle;

  return (
    <section
      id={uid}
      ref={sectionRef}
      className={className}
      style={portalStyle}
      data-gp-motion="pending"
    >
      <style>{`
        ${q}{position:relative;display:block;container-type:size;height:calc(var(--gp-length) * var(--gp-height,100svh));background:var(--gp-paper);color:var(--gp-ink);}
        ${q} *{box-sizing:border-box;}
        ${q} [data-gp-viewport]{position:absolute;width:1px;height:100svh;pointer-events:none;}
        ${q} [data-gp-pin]{position:relative;height:var(--gp-height,100svh);overflow:hidden;background:var(--gp-paper);}
        ${q} [data-gp-field]{position:absolute;inset:0;background:var(--gp-field);overflow:hidden;transform:scale(var(--gp-field-scale,1));transform-origin:center;}
        ${q} [data-gp-background]{position:absolute;inset:0;}
        ${q} [data-gp-background]>*{width:100%;height:100%;object-fit:cover;}
        ${q} [data-gp-art]{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;}
        ${q} [data-gp-glyph]{font-size:100px;font-weight:${weight};font-kerning:none;fill:var(--gp-ink);}
        ${q} [data-gp-marks]{fill:none;stroke:var(--gp-ink);pointer-events:none;}
        ${q} [data-gp-brand]{pointer-events:none;}
        ${q} [data-gp-choices]{position:absolute;inset:0;z-index:4;}
        ${q} [data-gp-letter]{position:absolute;border:0;padding:0;background:transparent;color:transparent;cursor:pointer;transform:translateY(0);}
        ${q} [data-gp-letter]:focus-visible{outline:2px solid var(--gp-ink);outline-offset:4px;}
        ${q} [data-gp-touch-picker]{position:absolute;z-index:7;left:8%;bottom:17%;display:none;align-items:center;gap:.75rem;color:var(--gp-ink);font:600 12px/1.4 Arial,sans-serif;}
        ${q} [data-gp-select]{min-height:44px;border:1px solid currentColor;border-radius:4px;background:var(--gp-paper);color:inherit;padding:0 34px 0 12px;font:inherit;}
        @media(any-pointer:coarse){${q} [data-gp-touch-picker]{display:flex;}}
        ${q} [data-gp-fallback]{position:absolute;inset:0;display:grid;place-items:center;font-size:min(calc(100cqw / var(--gp-characters)),38cqh);font-weight:${weight};line-height:1;color:var(--gp-field);}
        ${q}[data-gp-ready=true]:not([data-gp-motion=pending]) [data-gp-fallback]{visibility:hidden;}
        ${q} [data-gp-caption]{position:absolute;z-index:6;inset:auto 8% 9%;display:flex;align-items:center;justify-content:space-between;gap:1rem;font:12px/1.4 Arial,sans-serif;opacity:var(--gp-caption,1);pointer-events:var(--gp-caption-hit,auto);}
        ${q} [data-gp-front]{position:absolute;z-index:5;inset:0;opacity:var(--gp-caption,1);pointer-events:none;}
        ${q} [data-gp-front] a,${q} [data-gp-front] button{pointer-events:var(--gp-caption-hit,auto);}
        ${q} [data-gp-front]:focus-within{opacity:1;}
        ${q} [data-gp-hint]{max-width:30ch;color:var(--gp-ink);}
        ${q} [data-gp-enter]{display:inline-flex;align-items:center;gap:16px;min-height:44px;color:inherit;font:inherit;text-decoration:none;}
        ${q} [data-gp-enter]:focus-visible{outline:2px solid currentColor;outline-offset:5px;background:var(--gp-paper);color:var(--gp-ink);padding:0 12px;margin:0 -12px;}
        ${q} [data-gp-content]{box-sizing:border-box;position:absolute;z-index:8;inset:0;min-height:var(--gp-height,100svh);padding:clamp(32px,7%,100px);display:grid;align-content:center;color:var(--gp-foreground);background:var(--gp-field);overflow-wrap:anywhere;}
        ${q}[data-gp-motion=on] [data-gp-pin]{position:sticky;top:0;}
        ${q}[data-gp-motion=pending] [data-gp-pin]{position:sticky;top:0;}
        ${q}[data-gp-motion=pending] [data-gp-content]{opacity:0;pointer-events:none;}
        ${q}[data-gp-motion=pending] [data-gp-field],${q}[data-gp-motion=pending] [data-gp-art]{visibility:hidden;}
        ${q}[data-gp-motion=off] [data-gp-hint]{display:none;}
        ${q}[data-gp-motion=on] [data-gp-content]{opacity:var(--gp-reveal,0);pointer-events:none;}
        ${q}[data-gp-motion=on][data-gp-entered=true] [data-gp-content]{pointer-events:auto;}
        ${q}[data-gp-motion=on]:has([data-gp-content]:focus-within) [data-gp-field]{clip-path:none!important;}
        ${q}[data-gp-motion=on] [data-gp-content]:focus-within{opacity:1;pointer-events:auto;}
        ${q}:has([data-gp-content]:focus-within) [data-gp-caption],${q}:has([data-gp-content]:focus-within) [data-gp-marks]{opacity:0;}
        ${q} [data-gp-default-title]{color:inherit;font:500 clamp(32px,5vw,72px)/1.05 var(--font-display);max-width:13ch;margin:0 0 24px;text-wrap:balance;}
        ${q} [data-gp-default-copy]{color:inherit;font:16px/1.6 var(--font-sans);max-width:36ch;margin:0;}
        @media(prefers-reduced-motion:reduce){${q}{height:auto;} ${q} [data-gp-pin]{position:relative!important;} ${q} [data-gp-content]{position:relative!important;opacity:1!important;background:var(--gp-field)!important;min-height:0;padding-block:64px;} ${q} [data-gp-caption]{opacity:1!important;} ${q} [data-gp-hint]{display:none;}}
      `}</style>
      <span data-gp-viewport aria-hidden="true" />
      <div data-gp-pin>
        <div data-gp-fallback aria-hidden="true">
          {text}
        </div>
        <div data-gp-field aria-hidden="true">
          <div data-gp-background>{background}</div>
        </div>
        <svg data-gp-art aria-hidden="true">
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <text data-gp-glyph>{text}</text>
            </clipPath>
          </defs>
          <g data-gp-marks style={{ display: annotations ? undefined : "none" }}>
            <path />
          </g>
          {brandImage ? (
            <image data-gp-brand href={brandImage} preserveAspectRatio="xMidYMid meet" />
          ) : null}
        </svg>
        <div data-gp-choices role="radiogroup" aria-label="Escolha uma letra">
          {characters.map(({ char, index }, position) => (
            <button
              key={`${char}-${index}`}
              type="button"
              data-gp-letter={index}
              role="radio"
              aria-label={`${position + 1}, ${char}`}
            />
          ))}
        </div>
        <label data-gp-touch-picker style={minimalCaption ? { display: "none" } : undefined}>
          <span>Letra de entrada</span>
          <select data-gp-select defaultValue="" aria-label="Escolha uma letra">
            <option value="" disabled>
              Escolha
            </option>
            {characters.map(({ char, index }, position) => (
              <option key={`${char}-${index}`} value={index}>
                {position + 1} · {char}
              </option>
            ))}
          </select>
        </label>
        {front ? <div data-gp-front>{front}</div> : null}
        <div data-gp-caption style={minimalCaption ? { justifyContent: "center" } : undefined}>
          <span data-gp-hint>
            {minimalCaption
              ? "Role para ver mais"
              : interactive
                ? "Role para entrar."
                : annotations
                  ? "Uma passagem pela marca"
                  : ""}
          </span>
          {!minimalCaption ? (
            <a data-gp-enter href={`#${uid}-content`}>
              {enterLabel} <span aria-hidden="true">↘</span>
            </a>
          ) : null}
        </div>
        <div id={`${uid}-content`} data-gp-content>
          {children ?? (
            <div>
              <h2 data-gp-default-title>Uma letra se torna um lugar.</h2>
              <p data-gp-default-copy>A forma abre caminho para o que vem a seguir.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
