import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  ["Projetos", "#projetos"],
  ["Serviços", "#processo"],
  ["Contato", "#contato"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className="desktop-nav" aria-label="Navegação principal">
        {links.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      {open ? (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {links.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
