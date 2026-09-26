"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ExpandableGalleryImage {
  src: string;
  alt: string;
  title?: string;
  eyebrow?: string;
  description?: string;
}

interface ExpandableGalleryProps {
  images: ExpandableGalleryImage[];
  className?: string;
}

export function ExpandableGallery({ images, className = "" }: ExpandableGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const closeImage = React.useCallback(() => setSelectedIndex(null), []);
  const goToNext = React.useCallback(() => {
    setSelectedIndex((current) => (current === null ? null : (current + 1) % images.length));
  }, [images.length]);
  const goToPrev = React.useCallback(() => {
    setSelectedIndex((current) =>
      current === null ? null : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  React.useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeImage();
      if (event.key === "ArrowRight") goToNext();
      if (event.key === "ArrowLeft") goToPrev();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeImage, goToNext, goToPrev, selectedIndex]);

  const selectedImage = selectedIndex === null ? undefined : images[selectedIndex];

  return (
    <>
      <div
        className={cn(
          "flex h-[31rem] w-full gap-2 overflow-hidden md:h-[38rem] md:gap-3",
          className,
        )}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {images.map((image, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <motion.div
              key={image.src}
              className="relative min-w-0 overflow-hidden rounded-md bg-background"
              animate={{ flex: hoveredIndex === null ? 1 : isHovered ? 3.2 : 0.55 }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocusCapture={() => setHoveredIndex(index)}
            >
              <Button
                type="button"
                variant="ghost"
                className="group relative h-full w-full overflow-hidden rounded-md p-0 hover:bg-background focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Ampliar projeto: ${image.title ?? image.alt}`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  width={1600}
                  height={1000}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-primary/90 p-4 text-left text-primary-foreground backdrop-blur-sm md:p-6">
                  {image.eyebrow ? (
                    <p className="text-xs font-bold uppercase text-accent">{image.eyebrow}</p>
                  ) : null}
                  <h3 className="mt-1 whitespace-normal text-base font-semibold leading-snug md:text-xl">
                    {image.title}
                  </h3>
                  <AnimatePresence initial={false}>
                    {(isHovered || hoveredIndex === null) && image.description ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 hidden max-w-lg whitespace-normal text-sm leading-relaxed text-primary-foreground/70 md:block"
                      >
                        {image.description}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedImage && selectedIndex !== null ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-md md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImage}
            role="dialog"
            aria-modal="true"
            aria-label={`Projeto ampliado: ${selectedImage.title ?? selectedImage.alt}`}
          >
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4 z-10 md:right-8 md:top-8"
              onClick={closeImage}
              aria-label="Fechar imagem"
            >
              <X />
            </Button>

            {images.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 md:left-8"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPrev();
                }}
                aria-label="Projeto anterior"
              >
                <ChevronLeft />
              </Button>
            ) : null}

            <motion.figure
              key={selectedImage.src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-md bg-background shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                width={1920}
                height={1200}
                className="min-h-0 w-full flex-1 object-contain"
              />
              <figcaption className="border-t border-border px-5 py-4 md:px-7">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    {selectedImage.eyebrow ? (
                      <p className="text-xs font-bold uppercase text-accent">
                        {selectedImage.eyebrow}
                      </p>
                    ) : null}
                    <h3 className="mt-1 text-xl font-semibold md:text-2xl">
                      {selectedImage.title}
                    </h3>
                    {selectedImage.description ? (
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {selectedImage.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                    {selectedIndex + 1} / {images.length}
                  </span>
                </div>
              </figcaption>
            </motion.figure>

            {images.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 md:right-8"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNext();
                }}
                aria-label="Próximo projeto"
              >
                <ChevronRight />
              </Button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
