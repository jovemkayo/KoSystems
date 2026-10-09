import { useState } from "react";

const baseItems = [
  { name: "Prato da casa", price: 32 },
  { name: "Sobremesa", price: 10 },
];
const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function PosDemo() {
  const [view, setView] = useState("Caixa");
  const [items, setItems] = useState(baseItems);
  const [weight, setWeight] = useState("0.350");
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState("Pix");
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const parsedWeight = Number(weight);
  return (
    <div className="demo-shell">
      <header className="replica-header">
        <strong>PDV restaurante</strong>
        <span>Operador demo</span>
      </header>
      <div className="demo-tabs" role="tablist" aria-label="Módulos do PDV">
        {["Balança", "Caixa"].map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={view === tab}
            onClick={() => setView(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="replica-columns">
        <section className="replica-panel">
          <div className="demo-toolbar">
            <strong>Comandas abertas</strong>
            <span className="demo-kicker">01</span>
          </div>
          <div className="command-tile">
            <strong>1042</strong>
            <span>{paid ? "Concluída" : "Em aberto"}</span>
          </div>
          {view === "Balança" ? (
            <>
              <label className="replica-field">
                Peso em kg
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </label>
              <p className="demo-kicker">Valor por kg: R$ 50,00</p>
              <button
                type="button"
                className="demo-action"
                disabled={paid || !Number.isFinite(parsedWeight) || parsedWeight <= 0}
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    { name: `Prato por peso (${weight} kg)`, price: parsedWeight * 50 },
                  ])
                }
              >
                Lançar pesagem
              </button>
            </>
          ) : (
            <>
              <div className="demo-list" aria-live="polite">
                {items.map((item, index) => (
                  <div className="demo-row" key={index}>
                    <span>{item.name}</span>
                    <span>{money(item.price)}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="demo-action"
                disabled={paid}
                onClick={() =>
                  setItems((current) => [...current, { name: "Suco natural", price: 8 }])
                }
              >
                Adicionar suco
              </button>
            </>
          )}
        </section>
        <section className="replica-panel">
          <div className="demo-total">
            <span>Total selecionado</span>
            <strong>{money(total)}</strong>
          </div>
          <label className="replica-field">
            Forma de pagamento
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Débito</option>
              <option>Crédito</option>
            </select>
          </label>
          <button
            type="button"
            className="demo-action"
            disabled={paid}
            onClick={() => setPaid(true)}
          >
            Fechar pagamento
          </button>
          <p role="status" className="demo-feedback">
            {paid
              ? `Pagamento concluído por ${method}.`
              : "Selecione a comanda para concluir o pagamento."}
          </p>
        </section>
      </div>
    </div>
  );
}
