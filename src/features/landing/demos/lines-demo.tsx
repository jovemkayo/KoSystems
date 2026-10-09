import { useState } from "react";

const initialLines = [
  { id: "Linha 001", person: "Pessoa A", device: "Aparelho 01", status: "Funcionando" },
  { id: "Linha 002", person: "Pessoa B", device: "Aparelho 02", status: "Em análise" },
];

export function LinesDemo() {
  const [view, setView] = useState("Números");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState(initialLines);
  const [history, setHistory] = useState<string[]>([]);
  const filtered = lines.filter((line) =>
    `${line.id} ${line.person}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  return (
    <div className="demo-shell">
      <header className="replica-header">
        <strong>Controle de números</strong>
        <span>Administrador demo</span>
      </header>
      <div className="demo-tabs" role="tablist" aria-label="Módulos de linhas">
        {["Números", "Dispositivos", "Histórico"].map((tab) => (
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
      {view === "Números" ? (
        <>
          <label className="replica-field">
            Buscar número ou responsável
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por Linha 001 ou Pessoa A"
            />
          </label>
          <div className="lines-cards">
            {filtered.map((line) => (
              <section className="replica-panel" key={line.id}>
                <div className="demo-toolbar">
                  <strong>{line.id}</strong>
                  <span className="line-status">{line.status}</span>
                </div>
                <p>{line.person}</p>
                <span className="demo-kicker">{line.device}. Chip 1.</span>
                <button
                  type="button"
                  className="demo-action"
                  disabled={line.person === "Pessoa C"}
                  onClick={() => {
                    setHistory((current) => [
                      `${line.id}: ${line.person} para Pessoa C`,
                      ...current,
                    ]);
                    setLines((current) =>
                      current.map((item) =>
                        item.id === line.id ? { ...item, person: "Pessoa C" } : item,
                      ),
                    );
                  }}
                >
                  Trocar responsável
                </button>
              </section>
            ))}
          </div>
          {!filtered.length ? <p role="status">Nenhuma linha encontrada.</p> : null}
        </>
      ) : null}
      {view === "Dispositivos" ? (
        <div className="lines-cards">
          {lines.map((line) => (
            <section className="replica-panel" key={line.id}>
              <strong>{line.device}</strong>
              <p>{line.id}. Chip 1.</p>
              <span className="demo-kicker">Responsável: {line.person}</span>
            </section>
          ))}
        </div>
      ) : null}
      {view === "Histórico" ? (
        <section className="replica-panel">
          <strong>Movimentações</strong>
          {history.length ? (
            <ul>
              {history.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma movimentação nesta demonstração.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
