import type { Unit } from "./types";
import { normalizeName } from "./catalog";
export const units: Unit[] = [
  "kg",
  "g",
  "un",
  "maço",
  "caixa",
  "pacote",
  "bandeja",
  "pé",
  "l",
  "ml",
  "saco",
  "garrafa",
  "dúzia",
  "pote",
];
const aliases: Record<Unit, string[]> = {
  kg: ["kg", "kgs", "kl", "kj", "k", "quilo", "quilos", "kilo", "kilos"],
  g: ["g", "gs", "gr", "grs", "grama", "gramas"],
  un: ["u", "un", "und", "ud", "unid", "unidade", "unidades"],
  maço: ["maco", "macos", "mc", "mcs", "mç", "mçs", "masso", "massos"],
  caixa: ["cx", "caixa", "caixas", "caxa", "caxas"],
  pacote: ["pct", "pcts", "pc", "pt", "pacote", "pacotes"],
  bandeja: [
    "b",
    "bj",
    "bdj",
    "bdnj",
    "bndj",
    "bdjs",
    "bds",
    "bandeja",
    "bandejas",
  ],
  pé: ["p", "pe", "pes", "ps"],
  l: ["l", "lt", "litro", "litros"],
  ml: ["ml", "mililitro", "mililitros"],
  saco: ["saco", "sacos", "sc"],
  garrafa: ["garrafa", "garrafas", "grf"],
  dúzia: ["duzia", "duzias", "dz"],
  pote: ["pote", "potes"],
};
export function formatUnit(unit: Unit | null): string {
  if (!unit) return "";
  const names: Partial<Record<Unit, string>> = { g: "GRAMAS", un: "UNIDADE", l: "LITRO" };
  return names[unit] ?? unit.toLocaleUpperCase("pt-BR");
}
units.sort((a, b) => formatUnit(a).localeCompare(formatUnit(b), "pt-BR"));
export function normalizeUnit(text: string): Unit | null {
  return (
    units.find((unit) => aliases[unit].includes(normalizeName(text))) ?? null
  );
}
export function isCountUnit(unit: Unit | null): boolean {
  return unit !== null && !["kg", "g", "l", "ml"].includes(unit);
}
export const unitPattern =
  Object.values(aliases)
    .flat()
    .sort((a, b) => b.length - a.length)
    .join("|") + "|maços?|pés?|dúzias?";
