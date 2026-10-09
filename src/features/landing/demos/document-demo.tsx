import { useState } from "react";

type OrderRow = { product: string; quantity: string; unit: string };
const example = "12 cx tomate italiano\n8 un alface crespa\n25 kg batata lavada";

export function DocumentDemo() {
  const [source, setSource] = useState(example);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [view, setView] = useState("Administrativo");
  const [sent, setSent] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [error, setError] = useState("");
  function process() {
    const lines = source
      .trim()
      .split(/\n|·/)
      .filter((line) => line.trim());
    const parsed = lines.map((line) =>
      line.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|cx|caixas?|un|unidades?)\s+(.+)$/i),
    );
    if (!lines.length || parsed.some((line) => !line)) {
      setError("Use uma linha por item, como 3 kg cenoura.");
      return;
    }
    setRows(
      parsed.map((match) => ({
        quantity: match![1]!.replace(",", "."),
        unit: match![2]!,
        product: match![3]!.replace(/^./, (char) => char.toUpperCase()),
      })),
    );
    setSent(false);
    setChecked([]);
    setError("");
  }
  return (
    <div className="demo-shell">
      <header className="replica-header">
        <strong>Pedidos e separação</strong>
        <span>Cliente exemplo</span>
      </header>
      <div className="demo-tabs" role="tablist" aria-label="Módulos de pedidos">
        {["Administrativo", "Separação"].map((tab) => (
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
        {view === "Administrativo" ? (
          <section className="replica-panel">
            <strong>Novo pedido</strong>
            <label className="replica-field">
              Pedido recebido
              <textarea
                rows={5}
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setRows([]);
                  setSent(false);
                  setChecked([]);
                  setError("");
                }}
              />
            </label>
            <span className="demo-kicker">Exemplo de conteúdo extraído de pedido-exemplo.pdf</span>
            <button type="button" className="demo-action" onClick={process}>
              Processar exemplo
            </button>
            <p className="demo-feedback" role="status">
              {error ||
                (rows.length
                  ? `${rows.length} itens interpretados.`
                  : "Cole ou edite o pedido de exemplo.")}
            </p>
            {rows.length ? (
              <button
                type="button"
                className="demo-action"
                onClick={() => {
                  setSent(true);
                  setView("Separação");
                }}
              >
                Enviar para separação
              </button>
            ) : null}
          </section>
        ) : null}
        <section className="replica-panel">
          <strong>{view === "Separação" ? "Tablet da separação" : "Pedido interpretado"}</strong>
          {rows.length && (view === "Administrativo" || sent) ? (
            <div className="demo-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd.</th>
                    <th>Unidade</th>
                    {view === "Separação" ? <th>Separado</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      <td>{row.product}</td>
                      <td>{row.quantity}</td>
                      <td>{row.unit}</td>
                      {view === "Separação" ? (
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Separar ${row.product}`}
                            checked={checked.includes(index)}
                            onChange={(e) =>
                              setChecked((current) =>
                                e.target.checked
                                  ? [...current, index]
                                  : current.filter((item) => item !== index),
                              )
                            }
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="demo-kicker">Aguardando pedido.</p>
          )}
          {view === "Separação" ? (
            <p className="demo-feedback" role="status">
              {sent
                ? `${checked.length} de ${rows.length} itens separados`
                : "Nenhum pedido enviado."}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
