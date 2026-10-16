import type { Order } from "../domain/types";
import { formatUnit } from "../domain/units";
export function PrintSheet({
  order,
  printedAt,
  companyName = "",
}: {
  order: Order;
  printedAt: Date;
  companyName?: string | undefined;
}) {
  const items = [...order.items].sort((a, b) =>
    a.product.localeCompare(b.product, "pt-BR"),
  );
  const quantity = (value: number | null) =>
    value?.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) ?? "";
  return (
    <section className="print-area" aria-label="Folha de impressão">
      <header className="print-header">
        <div>
          {companyName.trim()&&<p>{companyName.trim().toLocaleUpperCase("pt-BR")}</p>}
          <h1>Pedido para separação</h1>
          <strong>
            Cliente: <span>{(order.customer || "Cliente não informado").toLocaleUpperCase("pt-BR")}</span>
          </strong>
        </div>
        <div className="print-meta">
          <p>{printedAt.toLocaleDateString("pt-BR")}</p>
          <p>
            {printedAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p>{items.length} {items.length === 1 ? "item" : "itens"}</p>
        </div>
      </header>
      <table className="print-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quant.</th>
            <th>Unidade</th>
            <th>Peso real</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.product.toLocaleUpperCase("pt-BR")}</td>
              <td>{quantity(item.quantity)}</td>
              <td>{formatUnit(item.unit)}</td>
              <td>{quantity(item.actualWeight)}</td>
              <td>{item.note.toLocaleUpperCase("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="print-footer">Order Workbench</footer>
    </section>
  );
}
