// Private in-memory storage. Never read the production site's browser storage.
window.demoStorage = (() => {
  const values = new Map();
  return { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: (k) => values.delete(k) };
})();
window.demoStorage.setItem("estalagem-pdv-session-v1", JSON.stringify({ id: "demo-admin", name: "Visitante demonstração", role: "admin" }));
window.ESTALAGEM_SUPABASE = {};
document.getElementById("logoutBtn").addEventListener("click", (event) => { event.stopImmediatePropagation(); location.reload(); }, true);
window.open = () => { alert("Envio externo disponível apenas no sistema de produção. Esta demonstração usa dados fictícios."); return null; };
window.print = () => alert("Impressão simulada. Nenhum documento foi enviado a uma impressora.");
