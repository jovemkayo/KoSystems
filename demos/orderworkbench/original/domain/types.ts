export type Unit =
  | "kg"
  | "g"
  | "un"
  | "maço"
  | "caixa"
  | "pacote"
  | "bandeja"
  | "pé"
  | "l"
  | "ml"
  | "saco"
  | "garrafa"
  | "dúzia"
  | "pote";
export type OrderStage = "administrativo" | "separacao" | "retorno";
export interface OrderItem {
  id: string;
  product: string;
  quantity: number | null;
  unit: Unit | null;
  actualWeight: number | null;
  unitPrice: number | null;
  note: string;
}
export interface Order {
  customer: string;
  items: OrderItem[];
  stage: OrderStage;
}
export interface OrderWarning {
  lineNumber: number;
  text: string;
  reason: string;
}
export interface ParseResult {
  customer: string;
  items: OrderItem[];
  warnings: OrderWarning[];
}
export type ItemErrors = Partial<
  Record<
    "product" | "quantity" | "unit" | "actualWeight" | "unitPrice" | "note",
    string
  >
>;
