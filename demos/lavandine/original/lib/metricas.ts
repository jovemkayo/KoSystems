export type ItemGrafico = {
  label: string;
  value: number;
};

export function somarPor<T>(itens: T[], rotulo: (item: T) => string, valor: (item: T) => number) {
  return Object.values(
    itens.reduce<Record<string, ItemGrafico>>((acc, item) => {
      const label = rotulo(item);
      acc[label] = { label, value: (acc[label]?.value ?? 0) + valor(item) };
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);
}

export function filtrarPeriodo<T extends { data: string }>(itens: T[], de: string, ate: string) {
  return itens
    .filter((item) => (de ? item.data >= de : true))
    .filter((item) => (ate ? item.data <= ate : true));
}
