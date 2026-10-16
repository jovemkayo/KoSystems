import { validateItem } from "./validate-item";
import type { OrderItem } from "./types";
export interface InvoiceLine {
  item: OrderItem;
  billedQuantity: number | null;
  totalCents: number | null;
  pending: boolean;
}
export interface PreInvoice {
  lines: InvoiceLine[];
  totalCents: number;
  hasPending: boolean;
}
export function calculatePreInvoice(items: OrderItem[]): PreInvoice {
  let total = 0n;
  const lines = items.map((item) => {
    const pending =
      item.unitPrice === null || Object.keys(validateItem(item)).length > 0;
    const billedQuantity = item.actualWeight ?? item.quantity;
    if (pending || billedQuantity === null)
      return { item, billedQuantity, totalCents: null, pending: true };
    const product =
      BigInt(Math.round(billedQuantity * 1000)) *
      BigInt(Math.round(item.unitPrice! * 100));
    const cents = (product + 500n) / 1000n;
    total += cents;
    return { item, billedQuantity, totalCents: Number(cents), pending: false };
  });
  if (total > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("O total excede o limite de cálculo seguro.");
  return {
    lines,
    totalCents: Number(total),
    hasPending: lines.some((line) => line.pending),
  };
}
