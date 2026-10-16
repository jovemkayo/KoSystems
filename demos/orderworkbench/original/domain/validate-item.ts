import type { ItemErrors, OrderItem } from "./types";
import { isCountUnit, units } from "./units";
export function validQuantity(value: number | null): value is number {
  return (
    value !== null &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 1_000_000 &&
    Math.round(value * 1000) / 1000 === value
  );
}
export function validateItem(item: OrderItem): ItemErrors {
  const errors: ItemErrors = {};
  if (!item.product.trim() || item.product.trim().length > 120)
    errors.product = "Informe um produto com até 120 caracteres.";
  if (!item.unit || !units.includes(item.unit))
    errors.unit = "Escolha uma unidade.";
  if (!validQuantity(item.quantity))
    errors.quantity =
      "Use quantidade positiva até 1.000.000, com até 3 decimais.";
  else if (isCountUnit(item.unit) && !Number.isInteger(item.quantity * 2))
    errors.quantity = "Use quantidade inteira ou meia unidade (1/2).";
  if (item.actualWeight !== null && !validQuantity(item.actualWeight))
    errors.actualWeight = "Peso real deve ser positivo, com até 3 decimais.";
  if (
    item.unitPrice !== null &&
    (!Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0 ||
      item.unitPrice > 1_000_000 ||
      Math.round(item.unitPrice * 100) / 100 !== item.unitPrice)
  )
    errors.unitPrice =
      "Preço deve ter até 2 decimais e estar entre 0 e 1.000.000.";
  if (item.note.length > 240)
    errors.note = "A observação deve ter até 240 caracteres.";
  return errors;
}
