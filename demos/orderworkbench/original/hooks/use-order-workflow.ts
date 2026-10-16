import { useEffect, useRef, useState } from "react";
import { api } from "../auth/api";
import { toDrafts, toOrderItem } from "../domain/drafts";
import type { OrderDraftItem } from "../domain/drafts";
import type { OrderStage, ParseResult } from "../domain/types";
import { validateItem } from "../domain/validate-item";
import { transitionOrder } from "../domain/order-flow";
import { extractPdf } from "../pdf/extract-pdf";
export function useOrderWorkflow() {
  const [text, setText] = useState("Cliente: Exemplo fictício\n2 kg de tomate\n3 un de alface\n5 kg de batata");
  const [customer, setCustomer] = useState("");
  const [manualCustomer, setManualCustomer] = useState(false);
  const [items, setItems] = useState<OrderDraftItem[]>([]);
  const [warnings, setWarnings] = useState<ParseResult["warnings"]>([]);
  const [stage, setStage] = useState<OrderStage>("administrativo");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reading, setReading] = useState(false);
  const revision = useRef(0);
  const manualItemNumber = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      revision.current++;
      controller.current?.abort();
    },
    [],
  );
  const order = {
    customer: customer.trim(),
    items: items.map(toOrderItem),
    stage,
  };
  const valid =
    customer.trim().length <= 120 &&
    items.length > 0 &&
    order.items.every((item) => !Object.keys(validateItem(item)).length);
  function cancelRead() {
    revision.current++;
    controller.current?.abort();
    controller.current = null;
    setReading(false);
  }
  async function apply(source: string, current: number) {
    const result = await api<ParseResult>('/api/tools/parse', { text: source });
    if (current !== revision.current) return;
    setText(source);
    setItems(toDrafts(result.items));
    setWarnings(result.warnings);
    setStage("administrativo");
    if (!manualCustomer) setCustomer(result.customer);
    setError("");
    setNotice("Pedido interpretado. Confira os itens.");
  }
  async function interpret() {
    cancelRead();
    const current = revision.current;
    try {
      await apply(text, current);
    } catch (cause) {
      if (current !== revision.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Não consegui interpretar o pedido.",
      );
    }
  }
  async function readPdf(file: File) {
    cancelRead();
    const current = revision.current;
    const abort = new AbortController();
    controller.current = abort;
    setReading(true);
    setError("");
    setNotice("Lendo PDF…");
    try {
      const source = await extractPdf(file, abort.signal);
      if (current === revision.current && !abort.signal.aborted) await apply(source, current);
    } catch (cause) {
      if (current === revision.current && !abort.signal.aborted) {
        setError(
          cause instanceof Error ? cause.message : "Não consegui ler o PDF.",
        );
        setNotice("");
      }
    } finally {
      if (current === revision.current) {
        setReading(false);
        controller.current = null;
      }
    }
  }
  function add() {
    cancelRead();
    const id = "manual-" + ++manualItemNumber.current;
    setItems(previous => [...previous, { id, product: "", quantityText: "", unit: "un", weightText: "", priceText: "", note: "" }]);
    setNotice("Produto adicionado. Preencha o nome e a quantidade.");
  }
  function changeStage(target: OrderStage) {
    cancelRead();
    try {
      const next = transitionOrder(order, target);
      setStage(next.stage);
      setError("");
      setNotice(
        target === "separacao"
          ? "Pedido disponível nesta página para separação."
          : target === "retorno"
            ? "Confira os pesos e preços de referência."
            : "Pedido devolvido para revisão.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Confira o pedido.");
    }
  }
  return {
    text,
    customer,
    items,
    warnings,
    stage,
    error,
    notice,
    reading,
    order,
    valid,
    interpret,
    add,
    readPdf,
    changeStage,
    cancelRead,
    setNotice,
    changeText: (value: string) => {
      cancelRead();
      setText(value);
      setNotice("");
    },
    changeCustomer: (value: string) => {
      cancelRead();
      setCustomer(value);
      setManualCustomer(Boolean(value.trim()));
      setNotice("");
    },
    update: (id: string, value: Partial<OrderDraftItem>) => {
      cancelRead();
      setItems((previous) =>
        previous.map((item) => (item.id === id ? { ...item, ...value, product: (value.product ?? item.product).toLocaleUpperCase("pt-BR"), note: (value.note ?? item.note).toLocaleUpperCase("pt-BR") } : item)),
      );
      setNotice("");
    },
    remove: (id: string) => {
      cancelRead();
      setItems((previous) => previous.filter((item) => item.id !== id));
      setNotice("Item removido.");
    },
  };
}
