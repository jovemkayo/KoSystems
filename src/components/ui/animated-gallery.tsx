"use client";

import * as React from "react";
import {
  type HTMLMotionProps,
  type MotionValue,
  type Variants,
  motion,
  useScroll,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
  duration: 0.3,
};

const blurVariants: Variants = {
  hidden: { filter: "blur(10px)", opacity: 0, y: 18 },
  visible: { filter: "blur(0px)", opacity: 1, y: 0 },
};

const ContainerScrollContext = React.createContext<ContainerScrollContextValue | undefined>(
  undefined,
);

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error("useContainerScrollContext must be used within a ContainerScroll Component");
  }
  return context;
}

export const ContainerScroll = ({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div ref={scrollRef} className={cn("relative h-[240vh]", className)} style={style} {...props}>
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};

export const ContainerSticky = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("sticky top-0 flex h-screen items-center overflow-hidden", className)}
    {...props}
  />
);

export const GalleryContainer = ({
  children,
  className,
  style,
  ...props
}: HTMLMotionProps<"div">) => {
  const { scrollYProgress } = useContainerScrollContext();
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [75, 0]);
  const scale = useTransform(scrollYProgress, [0.5, 0.9], [1.2, 1]);
  return (
    <motion.div
      className={cn(
        "grid w-full grid-cols-3 gap-3 px-3 [perspective:1200px] md:gap-6 md:px-10",
        className,
      )}
      style={{ rotateX, scale, transformStyle: "preserve-3d", ...style }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const GalleryCol = ({
  className,
  style,
  yRange = ["0%", "-10%"],
  ...props
}: HTMLMotionProps<"div"> & { yRange?: string[] }) => {
  const { scrollYProgress } = useContainerScrollContext();
  const y = useTransform(scrollYProgress, [0.5, 1], yRange);
  return (
    <motion.div
      className={cn("flex flex-col gap-4 md:gap-6", className)}
      style={{ y, ...style }}
      {...props}
    />
  );
};

export const ContainerStagger = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, viewport, transition, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25, ...viewport }}
      transition={{ staggerChildren: 0.12, ...transition }}
      {...props}
    />
  ),
);
ContainerStagger.displayName = "ContainerStagger";

export const ContainerAnimated = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, transition, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={className}
      variants={blurVariants}
      transition={{ ...SPRING_CONFIG, ...transition }}
      {...props}
    />
  ),
);
ContainerAnimated.displayName = "ContainerAnimated";
