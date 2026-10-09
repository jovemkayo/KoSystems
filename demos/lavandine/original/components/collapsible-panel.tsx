import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CollapsiblePanelProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function CollapsiblePanel({
  title,
  children,
  action,
  className,
  defaultOpen = true,
}: CollapsiblePanelProps) {
  const [aberto, setAberto] = useState(defaultOpen);
  const conteudoId = useId();

  return (
    <section className={cn("card-soft min-w-0 overflow-hidden p-4 md:p-5", className)}>
      <div
        className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2", aberto && "mb-3")}
      >
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`${aberto ? "Recolher" : "Expandir"} ${title}`}
            aria-expanded={aberto}
            aria-controls={conteudoId}
            onClick={() => setAberto((atual) => !atual)}
          >
            {aberto ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>
      {aberto ? <div id={conteudoId}>{children}</div> : null}
    </section>
  );
}
