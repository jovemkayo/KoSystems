import { describe, expect, it } from "vitest";

import { buildWhatsAppUrl, defaultWhatsAppMessage } from "./contact";

describe("contato pelo WhatsApp", () => {
  it("mantém o número e a mensagem orientada", () => {
    const whatsappUrl = new URL(buildWhatsAppUrl());
    expect(`${whatsappUrl.origin}${whatsappUrl.pathname}`).toBe(
      "https://wa.me/5511930086602",
    );
    expect(whatsappUrl.searchParams.get("text")).toBe(defaultWhatsAppMessage);
    expect(defaultWhatsAppMessage).toBe(
      "Olá! Gostaria de solicitar um orçamento. Minha empresa atua no segmento de ___ e preciso de uma solução para ___.",
    );
  });
});
