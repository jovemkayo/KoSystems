import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Phone, Smartphone, UsersRound, History, ShieldCheck } from "lucide-react";

// Only the in-use line management project is presented. The ERP under construction is separate.
export function ErpNavigation({ mobile = false, admin = false }) {
  const links = [
    ["/dashboard", "Painel", LayoutDashboard], ["/numeros", "Números", Phone],
    ["/dispositivos", "Dispositivos", Smartphone], ["/funcionarias", "Colaboradoras", UsersRound],
    ["/historico", "Histórico", History], ...(admin ? [["/usuarios", "Acessos", ShieldCheck]] : []),
  ] as const;
  return <nav aria-label="Navegação principal" className={mobile ? "flex overflow-x-auto" : "flex items-center gap-1"}>
    {links.map(([to, label, Icon]) => <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent" activeProps={{ className: "bg-primary/10 text-primary" }}><Icon className="h-4 w-4" />{label}</Link>)}
  </nav>;
}
