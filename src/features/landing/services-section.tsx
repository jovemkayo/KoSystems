import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { services } from "./content";

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!list || !section || !sticky) return;
    const rows = Array.from(list.querySelectorAll("article"));
    let frame = 0;
    const updateFocus = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      // Use the sticky panel's layout height, not transformed text geometry or
      // Safari's changing visual viewport as its address bar opens and closes.
      const panelHeight = sticky.offsetHeight || window.innerHeight;
      // Each service gets a stationary reading interval, including the last
      // one before the sticky panel releases. Rotation starts only once the
      // complete panel has entered the viewport.
      const progress = Math.max(
        0,
        Math.min(1, -bounds.top / Math.max(1, bounds.height - panelHeight)),
      );
      const phase = progress * (rows.length * 2 - 1);
      const current = Math.min(rows.length - 1, Math.floor(phase / 2));
      const transition = Math.max(0, Math.min(1, phase - current * 2 - 1));
      const eased = transition * transition * (3 - 2 * transition);
      const position = current + eased;
      const radius = Math.max(210, list.clientHeight * 0.55);
      rows.forEach((row, index) => {
        const distance = index - position;
        const angle = Math.max(-90, Math.min(90, distance * 48));
        const radians = (angle * Math.PI) / 180;
        row.dataset["settled"] = String(Math.abs(distance) < 0.0001);
        row.style.setProperty("--service-y", `${radius * Math.sin(radians)}px`);
        row.style.setProperty("--service-z", `${radius * (Math.cos(radians) - 1)}px`);
        row.style.setProperty("--service-angle", `${-angle}deg`);
        row.style.setProperty("--service-opacity", `${Math.max(0, 1 - Math.abs(distance) / 2)}`);
      });
      setFocusedIndex(Math.round(position));
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFocus);
    };
    updateFocus();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(sticky);
    observer.observe(list);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="servicos"
      className="section-shell services-section"
      aria-labelledby="services-title"
    >
      <div ref={stickyRef} className="services-sticky">
        <header className="section-heading">
          <div>
            <h2 id="services-title">O que sua equipe faz à mão pode virar parte do sistema.</h2>
          </div>
        </header>
        <div
          ref={listRef}
          className="services-list"
          data-focus-active={focusedIndex !== null}
          role="region"
          aria-label="Explore os serviços"
        >
          <div className="services-track">
            {services.map((service, index) => (
              <article
                key={service.number}
                className="service-row"
                data-service-index={index}
                data-focused={focusedIndex === index}
              >
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ArrowUpRight aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
