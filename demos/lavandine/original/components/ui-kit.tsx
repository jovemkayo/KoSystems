import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { statusEstoque, type StatusEstoque } from "@/lib/domain";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-success",
    negative: "text-destructive",
    warning: "text-warning-foreground",
  }[tone];

  return (
    <div className="card-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("mt-2 font-display text-xl md:text-2xl", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card-soft min-w-0 overflow-hidden p-4 md:p-5", className)}>
      {title || action ? (
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const statusStyles: Record<StatusEstoque, string> = {
  normal: "bg-success/12 text-success",
  baixo: "bg-warning/20 text-warning-foreground",
  esgotado: "bg-destructive/12 text-destructive",
};

const statusLabels: Record<StatusEstoque, string> = {
  normal: "Normal",
  baixo: "Baixo",
  esgotado: "Esgotado",
};

export function StatusBadge({ quantidade, minimo }: { quantidade: number; minimo: number }) {
  const status = statusEstoque(quantidade, minimo);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function BarList({
  items,
  formatar,
}: {
  items: { label: string; value: number }[];
  formatar: (valor: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <EmptyState>Sem dados no período.</EmptyState>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{formatar(item.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
