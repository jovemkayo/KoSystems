export const defaultWhatsAppMessage =
  "Olá! Gostaria de solicitar um orçamento. Minha empresa atua no segmento de ___ e preciso de uma solução para ___.";

export function buildWhatsAppUrl(message = defaultWhatsAppMessage): string {
  const url = new URL("https://wa.me/5511930086602");
  url.searchParams.set("text", message);
  return url.toString();
}
