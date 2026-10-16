import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const frame = useRef(0);
  useEffect(() => {
    const cancel = () => {
      window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    return () => {
      cancel();
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, []);

  function goToTop() {
    window.cancelAnimationFrame(frame.current);
    const start = window.scrollY;
    const finish = () => document.getElementById("inicio")?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || start <= 0) {
      window.scrollTo({ top: 0, behavior: "instant" });
      finish();
      return;
    }
    let startedAt: number | undefined;
    const step = (time: number) => {
      startedAt ??= time;
      const progress = Math.min(1, (time - startedAt) / 800);
      const top = progress === 1 ? 0 : start * (1 - progress) ** 3;
      // Override the page's native smooth scroll while the animation owns it.
      window.scrollTo({ top, behavior: "instant" });
      if (progress < 1) frame.current = window.requestAnimationFrame(step);
      else {
        frame.current = 0;
        finish();
      }
    };
    frame.current = window.requestAnimationFrame(step);
  }

  return (
    <button type="button" className="back-to-top" onClick={goToTop}>
      Voltar ao topo <ArrowUp aria-hidden="true" />
    </button>
  );
}
