import { useState } from "react";

const rows = [
  ["Tomate italiano", "12", "caixas"],
  ["Alface crespa", "8", "unidades"],
  ["Batata lavada", "25", "kg"],
];

export function DocumentDemo() {
  const [processed, setProcessed] = useState(false);

  return (
    <div className="demo-shell demo-document">
      <div className="demo-source">
        <span>pedido-exemplo.pdf</span>
        <p>12 cx tomate italiano · 8 un alface crespa · 25 kg batata lavada</p>
      </div>
      <button type="button" className="demo-action" onClick={() => setProcessed(true)}>
        Processar exemplo
      </button>
      {processed ? (
        <div className="demo-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd.</th>
                <th>Unidade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
