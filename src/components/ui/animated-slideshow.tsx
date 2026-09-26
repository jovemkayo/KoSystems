"use client";

import * as React from "react";
import { type HTMLMotionProps, MotionConfig, motion } from "motion/react";

import { cn } from "@/lib/utils";

interface TextStaggerHoverProps {
  text: string;
  index: number;
}

interface HoverSliderImageProps {
  index: number;
  imageUrl: string;
}

interface HoverSliderProps {}

interface HoverSliderContextValue {
  activeSlide: number;
  changeSlide: (index: number) => void;
}

function splitText(text: string) {
  const words = text.split(" ").map((word) => word.concat(" "));
  const characters = words.flatMap((word) => word.split(""));

  return { words, characters };
}

const HoverSliderContext = React.createContext<HoverSliderContextValue | undefined>(undefined);

function useHoverSliderContext() {
  const context = React.useContext(HoverSliderContext);
  if (context === undefined) {
    throw new Error("useHoverSliderContext must be used within a HoverSlider");
  }
  return context;
}

export const HoverSlider = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & HoverSliderProps
>(({ children, className, ...props }, ref) => {
  const [activeSlide, setActiveSlide] = React.useState(0);
  const changeSlide = React.useCallback((index: number) => setActiveSlide(index), []);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <HoverSliderContext.Provider value={{ activeSlide, changeSlide }}>
        <section ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </section>
      </HoverSliderContext.Provider>
    </MotionConfig>
  );
});
HoverSlider.displayName = "HoverSlider";

const WordStaggerHover = React.forwardRef<HTMLSpanElement, HTMLMotionProps<"span">>(
  ({ children, className, ...props }, ref) => (
    <motion.span
      ref={ref}
      className={cn("relative inline-block overflow-hidden", className)}
      {...props}
    >
      {children}
    </motion.span>
  ),
);
WordStaggerHover.displayName = "WordStaggerHover";

export const TextStaggerHover = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & TextStaggerHoverProps
>(({ text, index, className, ...props }, ref) => {
  const { activeSlide, changeSlide } = useHoverSliderContext();
  const { characters } = splitText(text);
  const isActive = activeSlide === index;

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={isActive}
      aria-label={`Ver: ${text}`}
      onMouseEnter={() => changeSlide(index)}
      onFocus={() => changeSlide(index)}
      onClick={() => changeSlide(index)}
      className={cn(
        "group w-full cursor-pointer py-3 text-left outline-none opacity-55 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background md:py-4",
        isActive && "opacity-100",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="flex flex-wrap">
        {characters.map((char, charIndex) => (
          <WordStaggerHover key={`${char}-${charIndex}`}>
            <motion.span
              className="block"
              animate={{ y: isActive ? "-100%" : "0%" }}
              transition={{ delay: charIndex * 0.012 }}
            >
              {char === " " ? "\u00a0" : char}
            </motion.span>
            <motion.span
              className="absolute inset-0 block text-accent"
              animate={{ y: isActive ? "0%" : "100%" }}
              transition={{ delay: charIndex * 0.012 }}
            >
              {char === " " ? "\u00a0" : char}
            </motion.span>
          </WordStaggerHover>
        ))}
      </span>
    </button>
  );
});
TextStaggerHover.displayName = "TextStaggerHover";

export const clipPathVariants = {
  visible: { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
  hidden: { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0px)" },
};

export const HoverSliderImageWrap = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative grid aspect-[4/3] overflow-hidden rounded-lg bg-muted [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1 [&>*]:size-full",
      className,
    )}
    {...props}
  />
));
HoverSliderImageWrap.displayName = "HoverSliderImageWrap";

export const HoverSliderImage = React.forwardRef<
  HTMLImageElement,
  HTMLMotionProps<"img"> & HoverSliderImageProps
>(({ index, imageUrl, className, alt = "", ...props }, ref) => {
  const { activeSlide } = useHoverSliderContext();
  const isActive = activeSlide === index;

  return (
    <motion.img
      ref={ref}
      src={imageUrl}
      alt={alt}
      loading="lazy"
      width={1200}
      height={912}
      variants={clipPathVariants}
      initial={false}
      animate={isActive ? "visible" : "hidden"}
      aria-hidden={!isActive}
      className={cn("object-cover", className)}
      {...props}
    />
  );
});
HoverSliderImage.displayName = "HoverSliderImage";
