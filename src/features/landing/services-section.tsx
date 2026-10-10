import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { services } from "./content";

export function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!list || !section || !track) return;
    const rows = Array.from(list.querySelectorAll("article"));
    let frame = 0;
    const updateFocus = () => {
      frame = 0;
      const viewport = list.getBoundingClientRect();
      const bounds = section.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(1, -bounds.top / Math.max(1, bounds.height - window.innerHeight)),
      );
      const trackTop = track.getBoundingClientRect().top;
      const centers = rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top - trackTop + rect.height / 2;
      });
      const firstCenter = centers[0];
      const lastCenter = centers[centers.length - 1];
      if (firstCenter === undefined || lastCenter === undefined) return;
      const center = firstCenter + progress * (lastCenter - firstCenter);
      track.style.transform = `translate3d(0, ${viewport.height / 2 - center}px, 0)`;
      let nearest: number | null = null;
      let distance = Infinity;
      centers.forEach((rowCenter, index) => {
        const nextDistance = Math.abs(rowCenter - center);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      setFocusedIndex(nearest);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFocus);
    };
    updateFocus();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
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
      <div className="services-sticky">
        <header className="section-heading">
          <div>
            <h2 id="services-title">Tecnologia aplicada ao jeito que sua empresa trabalha.</h2>
          </div>
        </header>
        <div
          ref={listRef}
          className="services-list"
          data-focus-active={focusedIndex !== null}
          role="region"
          aria-label="Explore os serviços"
        >
          <div ref={trackRef} className="services-track">
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
