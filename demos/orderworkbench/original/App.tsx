import { useState } from "react";
import { flushSync } from "react-dom";
import { useOrderWorkflow } from "./hooks/use-order-workflow";
import { OrderInput } from "./components/OrderInput";
import { OrderTable } from "./components/OrderTable";
import { PrintSheet } from "./components/PrintSheet";
import { Warnings } from "./components/Warnings";
import { shareOrderPdf } from "./pdf/export-order";
import { api } from "./auth/api";

type AccountProfile = { printNameEnabled?: boolean; name?: string };
export default function App({profile}:{profile?:AccountProfile|undefined}={}) {
  const flow = useOrderWorkflow();
  const [printedAt, setPrintedAt] = useState(() => new Date());
  const [printName,setPrintName]=useState<string|undefined>(()=>profile?.printNameEnabled?profile.name??undefined:undefined);
  const [sharing, setSharing] = useState(false);
  async function print() {
    if (!flow.valid) return;
    flow.cancelRead();
    try {
    const authorized=await api<{companyName?:string}>('/api/tools/authorize-print', {});
    flushSync(() => {setPrintName(authorized.companyName);setPrintedAt(new Date());});
    window.print();
    flow.setNotice("Impressão aberta com os itens atuais da tabela.");
    } catch (cause) { flow.setNotice(cause instanceof Error ? cause.message : 'Não foi possível autorizar a impressão.'); }
  }
  async function share() {
    if (!flow.valid || sharing) return;
    flow.cancelRead();
    setSharing(true);
    try {
      const result = await shareOrderPdf(flow.order);
      flow.setNotice(result === "shared" ? "PDF enviado para compartilhamento." : "PDF salvo. Você pode anexá-lo no email, Telegram ou WhatsApp.");
    } catch (error) {
      flow.setNotice(error instanceof Error && error.name === "AbortError"
        ? "Compartilhamento cancelado."
        : error instanceof Error ? error.message : "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setSharing(false);
    }
  }
  return (
    <>
      <div className="app-shell">
        <main id="main">
          <div className="workspace">
            <OrderInput text={flow.text} customer={flow.customer} reading={flow.reading}
              error={flow.error} onText={flow.changeText} onCustomer={flow.changeCustomer}
              onParse={flow.interpret}
              onPdf={(file) => { void flow.readPdf(file); }} onCancel={flow.cancelRead} />
            <section className="panel review-panel" aria-labelledby="review-title">
              <div className="panel-heading">
                <div><h2 id="review-title">Confira antes de separar</h2>
                  <p>{flow.customer.toLocaleUpperCase("pt-BR") || "Cliente não informado"} · campos editáveis</p>
                </div>
              </div>
              <div className="summary">
                <div><strong>{String(flow.items.length).padStart(2, "0")}</strong><span>itens reconhecidos</span></div>
                <div className={flow.warnings.length ? "summary-warning" : ""}>
                  <strong>{String(flow.warnings.length).padStart(2, "0")}</strong><span>linhas para conferir</span>
                </div>
              </div>
              <OrderTable items={flow.items} onChange={flow.update} onRemove={flow.remove} showPrices={false} />
              <button className="button secondary add-product" onClick={flow.add}>Adicionar produto</button>
              <Warnings warnings={flow.warnings} />
              <p className="notice" role="status">{flow.notice}</p>
              <div className="export-row">
                <div>
                  <p>A impressão inclui apenas os itens da tabela.</p>
                  {!flow.valid && <p className="export-hint">Corrija os campos ou adicione itens válidos para imprimir ou compartilhar.</p>}
                </div>
                <div className="export-actions">
                  <button className="button secondary" disabled={!flow.valid || sharing} onClick={() => { void share(); }} aria-busy={sharing}>
                    {sharing ? "Gerando PDF…" : "Compartilhar"}
                  </button>
                  <button className="button primary" disabled={!flow.valid} onClick={print}>Imprimir pedido</button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <PrintSheet order={flow.order} printedAt={printedAt} companyName={printName} />
    </>
  );
}
