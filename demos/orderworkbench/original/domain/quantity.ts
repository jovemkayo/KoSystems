/** Validate the original token before Number can erase excess precision. */
export function parseQuantityText(value: string): number {
  const token = value.trim();
  if (/^1\s*\/\s*2$/u.test(token)) return 0.5;
  return /^\d+(?:[.,]\d{1,3})?$/.test(token)
    ? Number(token.replace(",", "."))
    : NaN;
}
