import type { OrderWarning } from "../domain/types";
export function Warnings({ warnings }: { warnings: OrderWarning[] }) {
  if (!warnings.length)
    return (
      <p className="all-clear" role="status">
        ✓ Todas as linhas foram reconhecidas.
      </p>
    );
  return (
    <section className="warnings" aria-labelledby="warning-title">
      <h3 id="warning-title">
        Confira {warnings.length === 1 ? "esta linha" : "estas linhas"}
      </h3>
      <p>Complete os itens pendentes na tabela. Para linhas não reconhecidas, ajuste o texto e interprete novamente.</p>
      <ul>
        {warnings.map((warning, index) => (
          <li key={`${warning.lineNumber}-${index}`}>
            <span className="line-tag">Linha {warning.lineNumber}</span>
            <div>
              <code>{warning.text}</code>
              <p>{warning.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
