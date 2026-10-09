import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0 w-full space-y-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const controlClass =
  "block h-11 min-w-0 max-w-full w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 md:h-10 md:text-sm";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        controlClass,
        props.type === "date" && "date-input overflow-hidden pr-2",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(controlClass, "appearance-none pr-8", props.className)} />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(controlClass, "h-auto min-h-20 py-2 leading-relaxed", props.className)}
    />
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>;
}
