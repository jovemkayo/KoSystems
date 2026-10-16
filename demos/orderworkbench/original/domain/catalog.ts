export const catalog = [
  { id: "arroz", name: "Arroz" },
  { id: "feijao", name: "Feijão" },
  { id: "tomate", name: "Tomate" },
  { id: "batata", name: "Batata" },
  { id: "alface", name: "Alface" },
] as const;
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
