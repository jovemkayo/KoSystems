import type { OrderItem, Unit } from "./types";
import { parseQuantityText } from "./quantity";
export interface OrderDraftItem {
  id: string;
  product: string;
  quantityText: string;
  unit: Unit | null;
  weightText: string;
  priceText: string;
  note: string;
}
const decimal = (value: number | null) =>
  value === null ? "" : String(value).replace(".", ",");
export function toDrafts(items: OrderItem[]): OrderDraftItem[] {
  return [...items]
    .sort((a, b) => a.product.localeCompare(b.product, "pt-BR"))
    .map((item) => ({
      id: item.id,
      product: item.product.toLocaleUpperCase("pt-BR"),
      quantityText: decimal(item.quantity),
      unit: item.unit,
      weightText: decimal(item.actualWeight),
      priceText: decimal(item.unitPrice),
      note: item.note.toLocaleUpperCase("pt-BR"),
    }));
}
export function toOrderItem(draft: OrderDraftItem): OrderItem {
  const quantity = draft.quantityText.trim()
    ? parseQuantityText(draft.quantityText)
    : null;
  const actualWeight = draft.weightText.trim()
    ? parseQuantityText(draft.weightText)
    : null;
  const price = draft.priceText.trim();
  const unitPrice = price
    ? /^\d+(?:[.,]\d{1,2})?$/.test(price)
      ? Number(price.replace(",", "."))
      : NaN
    : null;
  return {
    id: draft.id,
    product: draft.product,
    quantity,
    unit: draft.unit,
    actualWeight,
    unitPrice,
    note: draft.note,
  };
}
