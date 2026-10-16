import type { Order, OrderStage } from "./types";
import { validateItem } from "./validate-item";
export function transitionOrder(order: Order, target: OrderStage): Order {
  if (target === "administrativo") return { ...order, stage: target };
  if (
    (target === "separacao" && order.stage !== "administrativo") ||
    (target === "retorno" && order.stage !== "separacao")
  )
    throw new Error("Conclua a etapa anterior primeiro.");
  if (
    !order.items.length ||
    order.items.some((item) => Object.keys(validateItem(item)).length)
  )
    throw new Error("Confira os campos dos itens antes de continuar.");
  return { ...order, stage: target };
}
