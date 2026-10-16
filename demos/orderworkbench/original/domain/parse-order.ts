import { productNames } from "./product-names";
import { normalizeName } from "./catalog";
import { normalizeUnit, unitPattern } from "./units";
import { validateItem } from "./validate-item";
import { parseQuantityText } from "./quantity";
import type { ParseResult, OrderItem } from "./types";

const words: Record<string, number> = {
  meio: 0.5,
  meia: 0.5,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
};
const q = `(?:1\\s*/\\s*2|-?\\d+(?:[.,]\\d+)?|${Object.keys(words).join("|")}|três)`;
const u = `(?:${unitPattern})`;
const quantityFirst = new RegExp(`^(${q})\\s*(${u})\\s+(.+)$`, "iu");
const productFirst = new RegExp(
  `^(.+?) (?:- )?(${q}) ?(${u})$`,
  "iu",
);
const unitFirst = new RegExp(`^(${u})\\s+(${q})\\s+(.+)$`, "iu");
const productUnitQuantity = new RegExp(`^(.+?) (${u})\\s+(${q})$`, "iu");
const countFirst = new RegExp(`^(${q})\\s+(.+)$`, "iu");
const countLast = new RegExp(`^(.+?)\\s+(${q})$`, "iu");
const nextItem = new RegExp(`^\\s+${q}(?:\\s*${u})?\\s+`, "iu");
const deliveryMetadata = /^(?:boleto\b|data\s+de\s+entrega\b|entregar\s+(?:dia|em)\b|horario\s+de\s+entrega\b|forma\s+de\s+pagamento\b|prazo\s+de\s+pagamento\b)/u;
const customerHeader = /^(?:cliente\s*[:\-]|nome\s*[:\-]|pedido\s+de|para\s*[:\-])\s*(.+)$/iu;
const greeting = /^(?:bom dia|boa tarde|boa noite|ola|oi)[!.,\s]*$/u;
const closing = /^(?:obrigad[oa]|muito obrigad[oa]|agradeco|atenciosamente)[!.,\s]*$/u;

function messageContext(lines: string[]): { customer: string; ignored: Set<number> } {
  const ignored = new Set<number>();
  const filled = lines.map((line, index) => ({ text: line.trim(), index })).filter(line => line.text);
  for (const line of filled) {
    if (greeting.test(normalizeName(line.text))) ignored.add(line.index);
  }
  const first = filled.find(line => !ignored.has(line.index));
  let customer = "";
  if (first) {
    // A delivery suffix marks the end of the customer's name in a chat header.
    const orderHeader = /^pedido\s+(?:(?:de|do|da)\s+)?(.+?)\s+(?=para\s+(?:amanh[ãa]|hoje|dia|entrega|\d)|amanh[ãa]\b|entrega\b)/iu.exec(first.text);
    const next = filled.find(line => line.index > first.index);
    if (orderHeader) {
      customer = orderHeader[1]!.trim();
    } else if (!customerHeader.test(first.text) && !looksLikeItem(first.text) &&
        !/\d/u.test(first.text) && /\p{L}/u.test(first.text) && next &&
        (looksLikeItem(next.text) || deliveryMetadata.test(normalizeName(next.text)))) {
      customer = first.text;
    }
    if (customer.length > 120) customer = "";
    if (customer) ignored.add(first.index);
  }
  // Only treat a short final name after a closing as a signature. Unknown lines
  // elsewhere must remain visible for review, and products are never signatures.
  for (let position = 0; position < filled.length; position++) {
    const line = filled[position]!;
    if (!closing.test(normalizeName(line.text))) continue;
    ignored.add(line.index);
    const signature = filled[position + 1];
    if (position === filled.length - 2 && signature &&
        filled.slice(0, position).some(value => looksLikeItem(value.text)) &&
        /^[\p{L}][\p{L}\s.'’\-]{0,79}$/u.test(signature.text) &&
        signature.text.split(/\s+/u).length <= 4 && !looksLikeItem(signature.text)) {
      ignored.add(signature.index);
    }
  }
  // An explicit customer field takes precedence over an inferred title.
  if (filled.some(line => !ignored.has(line.index) && customerHeader.test(line.text))) customer = "";
  return { customer, ignored };
}
function knownProduct(product: string): boolean {
  const name = normalizeName(product);
  return name.length >= 3 && productNames.some(value => {
    const candidate = normalizeName(value);
    return candidate === name || candidate.startsWith(name + " ");
  });
}

function flexibleMatch(content: string): RegExpExecArray | null {
  const forward = new RegExp(`(?:^|\\s)(${q})\\s*(${u})(?=$|\\s)`, "giu");
  const backward = new RegExp(`(?:^|\\s)(${u})\\s*(${q})(?=$|\\s)`, "giu");
  const matches = [...content.matchAll(forward)];
  const reversed = [...content.matchAll(backward)];
  if (matches.length + reversed.length !== 1) return null;
  const pair = matches[0] ?? reversed[0]!;
  const product = (content.slice(0, pair.index) + " " + content.slice(pair.index! + pair[0].length)).trim();
  if (!product) return null;
  return Object.assign([content, matches.length ? pair[1]! : pair[2]!, matches.length ? pair[2]! : pair[1]!, product], { index: 0, input: content }) as RegExpExecArray;
}
function looksLikeItem(content: string): boolean {
  const text = content.trim();
  if (normalizeUnit(text) || new RegExp(`^(?:${q}\\s*${u}|${u}\\s*${q})$`, "iu").test(text)) return false;

  if (/^(?:entregar|embalar|separar|colocar|manter|observa(?:ção|cao)|por\s+saco)\b/iu.test(text)) return false;
  if (knownProduct(text)) return true;
  const pendingUnit = new RegExp(`(?:^|\\s)(${u})(?=$|\\s)`, "iu").exec(text);
  if (pendingUnit) {
    const product = (text.slice(0, pendingUnit.index) + " " + text.slice(pendingUnit.index + pendingUnit[0].length)).trim();
    if (product && !/\d/u.test(product)) return true;
  }
  return quantityFirst.test(text) || productFirst.test(text) || unitFirst.test(text) || productUnitQuantity.test(text) || Boolean(flexibleMatch(text)) || countFirst.test(text) || countLast.test(text);
}

function splitItems(line: string): string[] {
  line = line.replace(new RegExp(`^([^;|]+);\\s*(${u});\\s*(${q})$`, "iu"), "$1 $2 $3");
  const segments: string[] = [];
  let start = 0;
  let parentheses = 0;
  for (let i = 0; i < line.length; i++) {
    const character = line[i];
    if (character === "(") parentheses++;
    if (character === ")") parentheses = Math.max(0, parentheses - 1);
    if (parentheses) continue;
    // Once an observation starts, all remaining separators belong to it.
    if (character === "|") break;
    if (character !== "," && character !== ";" && character !== "-") continue;
    if (character === "," && /\d/u.test(line[i - 1] ?? "") && /\d/u.test(line[i + 1] ?? "")) continue;
    if (character === "-" && (!/\s/u.test(line[i - 1] ?? "") || !/\s/u.test(line[i + 1] ?? ""))) continue;
    if (looksLikeItem(line.slice(start, i)) && looksLikeItem(line.slice(i + 1))) {
      segments.push(line.slice(start, i));
      start = i + 1;
    } else if (character === ";") break;
  }
  segments.push(line.slice(start));
  return segments;
}
export function parseOrder(text: string): ParseResult {
  if (text.length > 10000)
    throw new Error(
      "O pedido deve ter até 10.000 caracteres e 100 linhas preenchidas.",
    );
  const lines = text.split(/\r?\n/);
  if (lines.filter((line) => line.trim()).length > 100)
    throw new Error(
      "O pedido deve ter até 10.000 caracteres e 100 linhas preenchidas.",
    );
  const result: ParseResult = { customer: "", items: [], warnings: [] };
  const context = messageContext(lines);
  result.customer = context.customer;
  lines.forEach((original, index) => {
    if (context.ignored.has(index) || deliveryMetadata.test(normalizeName(original))) return;
    const line = original.trim().replace(/^[•*–]\s*|^-\s+/u, "");
    if (!line) return;
    const header = customerHeader.exec(line);
    if (header) {
      if (header[1]!.trim().length > 120)
        result.warnings.push({
          lineNumber: index + 1,
          text: original,
          reason: "Cliente deve ter até 120 caracteres.",
        });
      else if (!result.customer) result.customer = header[1]!.trim();
      return;
    }
    if (
      /^(?:endereço|endereco|telefone|cnpj|horário|horario)\s*[:\-]/iu.test(
        line,
      )
    )
      return;
    if (/^(?:produto|categ(?:oria)?|med|qnt|quantidade|preço|preco)\b/iu.test(line)) return;
    splitItems(line).forEach((segment, segmentIndex) => {
      const divider = segment.search(/[|;]/);
      let content = (
        divider < 0 ? segment : segment.slice(0, divider)
      ).trim().replace(/\s+/gu, " ");
      let note = divider < 0 ? "" : segment.slice(divider + 1).trim();
      content = content.replace(/\bR\$\s*[0-9]+(?:[,.][0-9]+)?\b/giu, "").trim();
      const observations: string[] = [];
      content = content.replace(/\b(?:bem\s+madur[oa]s?|madur[oa]s?|fresc[oa]s?)\b/giu, value => { observations.push(value); return " "; }).replace(/\s+/gu," ").trim();
      note = [...new Set(observations), note].filter(Boolean).join("; ");
      let first = quantityFirst.exec(content);
      let last = productFirst.exec(content);
      const inverted = unitFirst.exec(content);
      const columns = productUnitQuantity.exec(content);
      if (first && last && !inverted && !columns &&
          ["saco", "caixa", "pacote", "garrafa", "pote"].includes(normalizeUnit(first[2]!) ?? "") &&
          ["kg", "g", "l", "ml"].includes(normalizeUnit(last[3]!) ?? "")) {
        const packageWeight = new RegExp(`\\s+${q}\\s*${u}$`, "iu").exec(first[3]!);
        if (packageWeight) {
          note = [packageWeight[0].trim(), note].filter(Boolean).join("; ");
          first[3] = first[3]!.slice(0, packageWeight.index).trim();
          last = null;
        }
      }
      if (!first && !last && !inverted && !columns) first = flexibleMatch(content);
      const countedFirst = countFirst.exec(content);
      const implicitFirst = countedFirst && !normalizeUnit(countedFirst[2]!) ? countedFirst : null;
      const countedLast = countLast.exec(content);
      const implicitLast = countedLast && !normalizeUnit(countedLast[1]!) ? countedLast : null;
      const match = first ?? last ?? inverted ?? columns ?? implicitFirst ?? implicitLast;
      if ([first, last, inverted, columns].filter(Boolean).length > 1) {
        result.warnings.push({
          lineNumber: index + 1,
          text: segment,
          reason: "Linha ambígua. Separe os produtos em linhas distintas e confira as quantidades.",
        });
        return;
      }
      if (!match) {
        const unitOnly = new RegExp(`(?:^|\\s)(${u})(?=$|\\s)`, "iu").exec(content);
        const pendingProduct = unitOnly ? (content.slice(0, unitOnly.index) + " " + content.slice(unitOnly.index + unitOnly[0].length)).trim() : content;
        const known = knownProduct(pendingProduct);
        if (pendingProduct && !/\d/u.test(pendingProduct) && (unitOnly || known)) {
          result.items.push({id: `line-${index + 1}-${segmentIndex}`, product: pendingProduct, quantity: null, unit: unitOnly ? normalizeUnit(unitOnly[1]!) : null, actualWeight: null, unitPrice: null, note});
          result.warnings.push({lineNumber: index + 1, text: segment, reason: "Item incompleto. Preencha a quantidade e confira a unidade na tabela."});
          return;
        }
        result.warnings.push({
          lineNumber: index + 1,
          text: segment,
          reason:
            "Não reconheci produto, quantidade e unidade. Revise esta linha.",
        });
        return;
      }
      const token = first ? match[1]! : columns ? match[3]! : inverted || last ? match[2]! : implicitFirst ? match[1]! : match[2]!;
      const quantity = words[normalizeName(token)] ?? parseQuantityText(token);
      const unit = normalizeUnit(
        first ? match[2]! : last ? match[3]! : inverted ? match[1]! : columns ? match[2]! : "un",
      );
      let product = (first || inverted ? match[3]! : columns || last ? match[1]! : implicitFirst ? match[2]! : match[1]!).replace(/\s+-$/, "").trim();
      product = product.replace(new RegExp(`^${q}\\s+(?:sacos?|caixas?|pacotes?)\\s+(?:de\\s+)?`, "iu"), "");
      if (columns || /^frutas\s/iu.test(product)) product = product.replace(/^(?:hortifruti|frutas|legumes|verduras|proteínas)\s+/iu, "");
      product = product.replace(/^de\s+/iu, "");
      const packaging = new RegExp(`\\s+(?:sacos?|cx|caixas?|pct|pacotes?)\\s*\\/?\\s*${q}\\s*${u}(?=$|\\s)`, "iu").exec(product);
      if (packaging) {
        note = [packaging[0].trim(), note].filter(Boolean).join("; ");
        product = (product.slice(0, packaging.index) + " " + product.slice(packaging.index + packaging[0].length)).trim();
      }
      const trailingUnit = new RegExp(`\\s+(${u})$`, "iu").exec(product);
      if (trailingUnit && normalizeUnit(trailingUnit[1]!) === unit) product = product.slice(0, trailingUnit.index).trim();

      const freshness = /\s+(bem\s+madur[oa]s?|madur[oa]s?|fresc[oa]s?)$/iu.exec(product);
      if (freshness) {
        note = [freshness[1], note].filter(Boolean).join("; ");
        product = product.slice(0, freshness.index).trim();
      }
      const parenthetical = /\s*\(([^)]*)\)\s*$/.exec(product);
      if (parenthetical) {
        note = [parenthetical[1]?.trim(), note].filter(Boolean).join("; ");
        product = product.slice(0, parenthetical.index).trim();
      }
      const item: OrderItem = {
        id: `line-${index + 1}-${segmentIndex}`,
        product,
        quantity,
        unit,
        actualWeight: null,
        unitPrice: null,
        note,
      };
      const errors = validateItem(item);
      if (Object.keys(errors).length)
        result.warnings.push({
          lineNumber: index + 1,
          text: segment,
          reason: Object.values(errors).join(" "),
        });
      else result.items.push(item);
    });
  });
  return result;
}
