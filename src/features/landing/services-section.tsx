import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollShadow } from "@/components/ui/heroui-scroll-shadow";
import { services } from "./content";

export function ServicesSection() {
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.querySelectorAll("article"));
    let frame = 0;
    const updateFocus = () => {
      frame = 0;
      const viewport = list.getBoundingClientRect();
      const center = viewport.top + viewport.height / 2;
      let nearest: number | null = null;
      let distance = Infinity;
      rows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) return;
        const nextDistance = Math.abs(rect.top + rect.height / 2 - center);
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
    list.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      list.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section
      id="servicos"
      className="section-shell services-section"
      aria-labelledby="services-title"
    >
      <header className="section-heading">
        <div>
          <h2 id="services-title">Tecnologia aplicada ao jeito que sua empresa trabalha.</h2>
        </div>
      </header>
      <ScrollShadow
        ref={listRef}
        className="services-list"
        data-focus-active={focusedIndex !== null}
        role="region"
        aria-label="Explore os serviços"
        tabIndex={0}
        size={48}
        hideScrollBar
      >
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
      </ScrollShadow>
    </section>
  );
}
