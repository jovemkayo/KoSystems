import { useState } from "react";

export function ManagementDemo() {
  const [view, setView] = useState("Estoque");
  const [sales, setSales] = useState(0);
  return (
    <div className="replica-management">
      <aside className="replica-sidebar">
        <strong>Gestão integrada</strong>
        <div className="demo-tabs" role="tablist" aria-label="Visões da operação">
          {["Estoque", "Vendas", "Financeiro"].map((tab) => (
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
      </aside>
      <div className="demo-shell">
        <header className="replica-header">
          <strong>{view === "Financeiro" ? "Resultado do mês" : view}</strong>
          <span>Visão da operação</span>
        </header>
        <div className="replica-metrics">
          <div>
            <span>Vendas</span>
            <strong>{184 + sales}</strong>
          </div>
          <div>
            <span>Produtos prontos</span>
            <strong>{72 - sales}</strong>
          </div>
          <div>
            <span>Em atenção</span>
            <strong>02</strong>
          </div>
        </div>
        {view === "Estoque" ? (
          <section className="replica-panel">
            <strong>Produtos em estoque</strong>
            <div className="demo-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Produto A</td>
                    <td>{24 - sales} un</td>
                    <td>Normal</td>
                  </tr>
                  <tr>
                    <td>Produto B</td>
                    <td>48 un</td>
                    <td>Normal</td>
                  </tr>
                  <tr>
                    <td>Insumo C</td>
                    <td>2 kg</td>
                    <td>Abaixo do mínimo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {view === "Vendas" ? (
          <section className="replica-panel">
            <strong>Nova venda</strong>
            <p>Cliente exemplo. Uma unidade do Produto A por R$ 40,00.</p>
            <button
              className="demo-action"
              type="button"
              disabled={sales >= 24}
              onClick={() => setSales((current) => current + 1)}
            >
              Registrar venda de exemplo
            </button>
            <p className="demo-feedback" role="status">
              {sales
                ? `${sales} venda(s) registrada(s). Estoque atualizado.`
                : "Pronto para registrar."}
            </p>
          </section>
        ) : null}
        {view === "Financeiro" ? (
          <section className="replica-panel">
            <div className="demo-metric">
              <span>Receitas menos despesas</span>
              <strong>
                {(28400 + sales * 40).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
            <div className="demo-bars" aria-hidden="true">
              {[46, 72, 58, 88, 64, 94].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
