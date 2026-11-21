import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("restaurant preview", () => {
  it("loads the current visual layer and its local supporting scripts", () => {
    const dom = new JSDOM(read("./index.html"), { runScripts: "outside-only" });
    try {
      expect(dom.window.document.querySelector('link[href="./assets/css/ui.css"]')).not.toBeNull();
      dom.window.eval(read("./assets/js/domain.js"));
      dom.window.eval(read("./assets/js/sync.js"));
      expect(dom.window.EstalagemDomain.itemTotal({ unitPrice: 7, quantity: 3 })).toBe(21);
      expect(dom.window.EstalagemSync).toBeDefined();
      expect(dom.window.document.querySelector("#cashSummaryModal")).not.toBeNull();
    } finally {
      dom.window.close();
    }
  });

  it("sorts by fictitious sales from the last 30 days while offline", async () => {
    const dom = new JSDOM(read("./index.html"), {
      url: "https://demo.invalid/demos/estalagem/index.html",
      runScripts: "outside-only",
    });
    try {
      for (const file of ["domain.js", "sync.js"]) dom.window.eval(read(`./assets/js/${file}`));
      dom.window.eval(read("./demo-environment.js"));
      Object.defineProperty(dom.window, "localStorage", { value: dom.window.demoStorage });
      Object.defineProperty(dom.window, "sessionStorage", { value: dom.window.demoStorage });
      const date = (daysAgo) => {
        const value = new Date();
        value.setDate(value.getDate() - daysAgo);
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
      };
      const sale = (id, daysAgo, productId, quantity) => ({
        id, date: date(daysAgo), orders: [{ items: [{ productId, quantity, price: 5 }] }],
      });
      dom.window.demoStorage.setItem("estalagem-pdv-state-v4", JSON.stringify({
        products: [
          { id: "example-a", name: "Bebida A", category: "bebidas", price: 5 },
          { id: "example-b", name: "Bebida B", category: "bebidas", price: 5 },
        ],
        sales: [sale("recent", 1, "example-b", 2), sale("old", 31, "example-a", 50),
          sale("future", -1, "example-a", 50), sale("cancelled", 1, "example-a", 50)],
        cancelledSaleIds: ["cancelled"],
      }));
      dom.window.eval(read("./assets/js/app.js"));
      dom.window.document.querySelector('[data-view="config"]').click();
      const sort = dom.window.document.querySelector('[data-product-sort="bebidas"]');
      sort.value = "popularity";
      sort.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await expect.poll(() => JSON.parse(dom.window.demoStorage.getItem("estalagem-pdv-state-v4"))
        .productSortModes?.bebidas).toBe("popularity");
      const saved = JSON.parse(dom.window.demoStorage.getItem("estalagem-pdv-state-v4"));
      expect(saved.productPopularity.counts).toEqual({ "example-b": 2 });
      expect(dom.window.document.querySelector("#commandMax").max).toBe("50");
    } finally {
      dom.window.close();
    }
  });

  it("opens and closes a fictitious order without a backend", async () => {
    const dom = new JSDOM(read("./index.html"), {
      url: "https://demo.invalid/demos/estalagem/index.html",
      runScripts: "outside-only",
    });
    try {
      for (const file of ["domain.js", "sync.js"]) {
        dom.window.eval(read(`./assets/js/${file}`));
      }
      dom.window.eval(read("./demo-environment.js"));
      Object.defineProperty(dom.window, "localStorage", { value: dom.window.demoStorage });
      Object.defineProperty(dom.window, "sessionStorage", { value: dom.window.demoStorage });
      dom.window.demoStorage.setItem("estalagem-pdv-state-v4", JSON.stringify({
        orders: [{ id: "demo-order", command: 1, status: "open", items: [
          { id: "demo-item", name: "Refeição de exemplo", price: 25, quantity: 1 },
        ] }],
      }));
      dom.window.eval(read("./assets/js/app.js"));
      expect(dom.window.document.querySelectorAll("#availableCommands button")).toHaveLength(50);
      expect(dom.window.document.querySelector('[data-view="fiado"]')).toBeNull();
      expect(dom.window.document.body.classList.contains("locked")).toBe(false);
      expect(dom.window.document.querySelector('script[src*="supabase"]')).toBeNull();
      dom.window.document.querySelector('[data-view="caixa"]').click();
      expect(dom.window.document.querySelector("#view-caixa").classList.contains("active")).toBe(true);
      dom.window.document.querySelector("#openOrders .order-card").click();
      dom.window.document.querySelector("#closePaymentBtn").click();
      expect(dom.window.document.querySelector("#openOrders .order-card")).toBeNull();
      const saved = JSON.parse(dom.window.demoStorage.getItem("estalagem-pdv-state-v4"));
      expect(saved.sales).toHaveLength(1);
      expect(saved.sales[0].total).toBe(25);
    } finally {
      dom.window.close();
    }
  });
});
