export const defaultWhatsAppMessage = "Olá! Gostaria de solicitar um orçamento.";

export function buildWhatsAppUrl(message = defaultWhatsAppMessage): string {
  const url = new URL("https://wa.me/5511930086602");
  url.searchParams.set("text", message);
  return url.toString();
}
