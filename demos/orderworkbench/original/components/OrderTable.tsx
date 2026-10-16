import { validateItem } from "../domain/validate-item";
import { toOrderItem } from "../domain/drafts";
import type { OrderDraftItem } from "../domain/drafts";
import { formatUnit, normalizeUnit, units } from "../domain/units";
interface Props {
  items: OrderDraftItem[];
  onChange: (id: string, value: Partial<OrderDraftItem>) => void;
  onRemove: (id: string) => void;
  showPrices: boolean;
}
export function OrderTable({ items, onChange, onRemove, showPrices }: Props) {
  if (!items.length)
    return (
      <div className="empty-state">
        <p>Nenhum item para conferir.</p>
        <small>Interprete um pedido para montar sua lista.</small>
      </div>
    );
  return (
    <div className="table-wrap">
      <table className="editable-order">
        <caption className="sr-only">
          Itens do pedido com campos editáveis
        </caption>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Peso real</th>
            <th>Observação</th>
            {showPrices && <th>Preço ref.</th>}
            <th>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const n = index + 1,
              errors = validateItem(toOrderItem(item)),
              errorId = item.id.startsWith("manual-") ? undefined : `errors-${item.id}`;
            return (
              <tr key={item.id}>
                <td data-label="Produto">
                  <input
                    aria-label={`Produto do item ${n}`}
                    value={item.product}
                    onChange={(e) =>
                      onChange(item.id, { product: e.target.value })
                    }
                    aria-invalid={Boolean(errors.product)}
                    aria-describedby={errors.product ? errorId : undefined}
                  />
                </td>
                <td data-label="Quantidade">
                  <input
                    aria-label={`Quantidade do item ${n}`}
                    inputMode="decimal"
                    value={item.quantityText}
                    onChange={(e) =>
                      onChange(item.id, { quantityText: e.target.value })
                    }
                    aria-invalid={Boolean(errors.quantity)}
                    aria-describedby={errors.quantity ? errorId : undefined}
                  />
                </td>
                <td data-label="Unidade">
                  <select
                    aria-label={`Unidade do item ${n}`}
                    value={item.unit ?? ""}
                    onChange={(e) =>
                      onChange(item.id, { unit: normalizeUnit(e.target.value) })
                    }
                    aria-invalid={Boolean(errors.unit)}
                  >
                    <option value="" disabled hidden />
                    {units.map((unit) => (
                      <option key={unit} value={unit}>{formatUnit(unit)}</option>
                    ))}
                  </select>
                </td>
                <td data-label="Peso real">
                  <input
                    aria-label={`Peso real do item ${n}`}
                    inputMode="decimal"
                    value={item.weightText}
                    placeholder="Em branco"
                    onChange={(e) =>
                      onChange(item.id, { weightText: e.target.value })
                    }
                    aria-invalid={Boolean(errors.actualWeight)}
                    aria-describedby={errors.actualWeight ? errorId : undefined}
                  />
                </td>
                <td data-label="Observação">
                  <textarea
                    rows={1}
                    aria-label={`Observação do item ${n}`}
                    value={item.note}
                    placeholder="Opcional"
                    onChange={(e) =>
                      onChange(item.id, { note: e.target.value })
                    }
                    aria-invalid={Boolean(errors.note)}
                    aria-describedby={errors.note ? errorId : undefined}
                  />
                  {errorId && Object.keys(errors).length > 0 && (
                    <p className="field-error" id={errorId} role="status">
                      {Object.values(errors).join(" ")}
                    </p>
                  )}
                </td>
                {showPrices && (
                  <td data-label="Preço ref.">
                    <input
                      aria-label={`Preço do item ${n}`}
                      inputMode="decimal"
                      value={item.priceText}
                      placeholder="Pendente"
                      onChange={(e) =>
                        onChange(item.id, { priceText: e.target.value })
                      }
                      aria-invalid={Boolean(errors.unitPrice)}
                      aria-describedby={errors.unitPrice ? errorId : undefined}
                    />
                  </td>
                )}
                <td className="remove-cell">
                  <button
                    className="remove-button"
                    aria-label={`Remover item ${n}`}
                    onClick={() => {
                      const message = item.product.trim()
                        ? `Excluir o produto "${item.product.trim()}" da tabela?`
                        : "Excluir este produto da tabela?";
                      if (window.confirm(message)) onRemove(item.id);
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
