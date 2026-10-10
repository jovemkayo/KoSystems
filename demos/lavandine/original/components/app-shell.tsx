import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  PackageSearch,
  Users,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/estoque", label: "Estoque", icon: Boxes },
  { to: "/producao", label: "Produção", icon: PackagePlus },
  { to: "/produtos", label: "Produtos", icon: PackageSearch },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/vendas", label: "Vendas", icon: Receipt },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
] as const;

const mobileNav = nav;

export function AppShell({ children }: { children: ReactNode }) {
  const { configurado, sessao, sair } = useAuth();

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 self-start overflow-y-auto border-r border-border bg-card md:flex md:flex-col">
        <div className="px-5 py-6">
          <Link to="/" className="block">
            <img
              src="/assets/logo-lavandine.png"
              alt="Lavandine Produtos Artesanais"
              className="h-auto w-44"
            />
          </Link>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary font-medium text-foreground" }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="space-y-3 px-5 py-5">
          {configurado && sessao ? (
            <Button variant="outline" size="sm" onClick={sair} className="w-full justify-start">
              <LogOut className="size-4" />
              Sair
            </Button>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" className="min-w-0">
            <img
              src="/assets/logo-lavandine.png"
              alt="Lavandine Produtos Artesanais"
              className="h-auto w-36"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/relatorios"
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground"
            >
              <BarChart3 className="size-4" />
              Relatórios
            </Link>
            {configurado && sessao ? (
              <button
                type="button"
                onClick={sair}
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
                aria-label="Sair"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-36 pt-4 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <nav aria-label="Navegação mobile" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {mobileNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex min-w-0 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
              activeProps={{ className: "text-primary font-medium" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold md:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
