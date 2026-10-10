import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Phone, Smartphone, UsersRound, History, ShieldCheck } from "lucide-react";

// Only the in-use line management project is presented. The ERP under construction is separate.
export function ErpNavigation({ mobile = false, admin = false }) {
  const links = [
    ["/dashboard", "Painel", LayoutDashboard], ["/numeros", "Números", Phone],
    ["/dispositivos", "Dispositivos", Smartphone], ["/funcionarias", "Colaboradoras", UsersRound],
    ["/historico", "Histórico", History], ...(admin ? [["/usuarios", "Acessos", ShieldCheck]] : []),
  ] as const;
  return <nav aria-label="Navegação principal" className={mobile ? "grid grid-cols-6" : "flex items-center gap-1"}>
    {links.map(([to, label, Icon]) => <Link key={to} to={to} aria-label={label} title={label} className={mobile ? "flex min-h-11 min-w-0 items-center justify-center rounded-md px-1 py-2 font-medium text-muted-foreground hover:bg-accent" : "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"} activeProps={{ className: "bg-primary/10 text-primary" }}><Icon className="h-5 w-5 shrink-0" />{mobile ? null : label}</Link>)}
  </nav>;
}
