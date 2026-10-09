import type { ReactNode } from "react";
import { CollapsiblePanel } from "@/components/collapsible-panel";
import { EmptyState } from "@/components/ui-kit";
import { brl } from "@/lib/domain";
import { rotuloVencimentoCobranca, type ClienteACobrar } from "@/lib/dashboard-financeiro";

type ClientesACobrarPanelProps = {
  clientes: ClienteACobrar[];
  action?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function ClientesACobrarPanel({
  clientes,
  action,
  className,
  defaultOpen = true,
}: ClientesACobrarPanelProps) {
  return (
    <CollapsiblePanel
      title="Clientes a cobrar"
      {...(action ? { action } : {})}
      {...(className ? { className } : {})}
      defaultOpen={defaultOpen}
    >
      {clientes.length === 0 ? (
        <EmptyState>Nenhum pagamento pendente.</EmptyState>
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto pr-1">
          {clientes.map((cliente) => (
            <li key={cliente.chave} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{cliente.nome}</p>
                <p
                  className={
                    cliente.atrasado ? "text-xs text-destructive" : "text-xs text-muted-foreground"
                  }
                >
                  {cliente.vendasPendentes} venda(s) · {rotuloVencimentoCobranca(cliente)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-warning-foreground">
                {brl(cliente.totalPendente)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CollapsiblePanel>
  );
}
