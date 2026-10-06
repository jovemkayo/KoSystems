import { useState } from "react";

const views = {
  Estoque: { label: "Itens em atenção", value: "06", note: "2 abaixo do mínimo" },
  Vendas: { label: "Pedidos no mês", value: "184", note: "+12% no período" },
  Financeiro: { label: "Resultado do mês", value: "R$ 28,4 mil", note: "Receitas − despesas" },
} as const;

type View = keyof typeof views;

export function ManagementDemo() {
  const [view, setView] = useState<View>("Estoque");
  const current = views[view];

  return (
    <div className="demo-shell">
      <div className="demo-tabs" role="tablist" aria-label="Visões da operação">
        {(Object.keys(views) as View[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={view === item}
            onClick={() => setView(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="demo-metric">
        <span>{current.label}</span>
        <strong>{current.value}</strong>
        <small>{current.note}</small>
      </div>
      <div className="demo-bars" aria-hidden="true">
        {[46, 72, 58, 88, 64, 94].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  );
}
