import { useMemo, useState } from "react";

const baseItems = [
  { name: "Prato da casa", price: 32 },
  { name: "Sobremesa", price: 10 },
];

export function PosDemo() {
  const [items, setItems] = useState(baseItems);
  const [status, setStatus] = useState<"Em preparo" | "Pronto">("Em preparo");
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

  return (
    <div className="demo-shell">
      <div className="demo-toolbar">
        <div>
          <span className="demo-kicker">Mesa 08</span>
          <strong>Comanda #1042</strong>
        </div>
        <button className="demo-status" type="button" onClick={() => setStatus("Pronto")}>
          {status}
        </button>
      </div>
      <div className="demo-list" aria-live="polite">
        {items.map((item, index) => (
          <div className="demo-row" key={`${item.name}-${index}`}>
            <span>{item.name}</span>
            <span>{item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
          </div>
        ))}
      </div>
      <div className="demo-total">
        <span>Total</span>
        <strong>{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
      </div>
      <button
        type="button"
        className="demo-action"
        onClick={() => setItems((current) => [...current, { name: "Suco natural", price: 8 }])}
      >
        Adicionar suco
      </button>
    </div>
  );
}
