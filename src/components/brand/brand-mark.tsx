import type { CSSProperties } from "react";

type BrandMarkProps = {
  surface: "light" | "dark";
  format?: "lockup" | "symbol";
  className?: string;
};

const lockups = {
  light: "/brand/ko-systems-navy.png",
  dark: "/brand/ko-systems-navy.png",
} as const;

export function BrandMark({ surface, format = "lockup", className }: BrandMarkProps) {
  const isSymbol = format === "symbol";
  const style =
    surface === "dark"
      ? ({
          filter: "brightness(0) invert(1)",
        } satisfies CSSProperties)
      : undefined;

  return (
    <img
      src={isSymbol ? "/favicon.png" : lockups[surface]}
      alt={isSymbol ? "Símbolo KO Systems" : "KO Systems"}
      className={className}
      style={style}
      draggable={false}
    />
  );
}
