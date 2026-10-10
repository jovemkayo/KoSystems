import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("demo scope", () => {
  it("keeps restaurant payment methods available without credit tabs or more than fifty commands", () => {
    const dom = new JSDOM(source("../estalagem/index.html"), {
      url: "https://demo.invalid",
      runScripts: "outside-only",
    });
    try {
      dom.window.eval(source("../estalagem/assets/js/app.js"));
      const doc = dom.window.document;
      expect(doc.querySelectorAll("#availableCommands button")).toHaveLength(50);
      expect([...doc.querySelectorAll("#paymentMethod option")].map((el) => el.value)).toContain(
        "Dinheiro",
      );
      expect(
        [...doc.querySelectorAll("#paymentMethod option")].map((el) => el.value),
      ).not.toContain("Fiado");
      expect(doc.querySelector('[data-view="fiado"]')).toBeNull();
      expect(doc.querySelector("#view-fiado")).toBeNull();
    } finally {
      dom.window.close();
    }
  });

  it("interprets and prepares an order for printing without separation or invoice modules", () => {
    const dom = new JSDOM(source("../macauba/index.html"), {
      url: "https://demo.invalid",
      runScripts: "outside-only",
    });
    try {
      dom.window.eval(source("../macauba/app.js"));
      const doc = dom.window.document;
      doc.querySelector("#clienteInput").value = "Cliente de exemplo";
      doc.querySelector("#pedidoInput").value =
        "12 caixas de tomate italiano\n8 unidades de alface crespa";
      doc.querySelector("#interpretarBtn").click();
      expect(doc.querySelectorAll("#adminTabela tr")).toHaveLength(2);
      dom.window.print = () => {};
      doc.querySelector("#imprimirPedidoBtn").click();
      expect(doc.querySelector("#printArea").textContent).toContain("TOMATE ITALIANO");
      expect(doc.querySelectorAll(".view")).toHaveLength(1);
      expect(doc.querySelector("#enviarSeparacaoBtn")).toBeNull();
    } finally {
      dom.window.close();
    }
  });
});
