import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Order } from "../domain/types";
import { formatUnit } from "../domain/units";

const upper = (text: string) => text.toLocaleUpperCase("pt-BR");
const decimal = (value: number | null) => value?.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) ?? "";

export function createOrderPdf(order: Order, printedAt = new Date(), companyName = ""): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth=doc.internal.pageSize.getWidth(),pageHeight=doc.internal.pageSize.getHeight();
  const customer = upper(order.customer.trim() || "Cliente não informado");
  const items = [...order.items].sort((a, b) => a.product.localeCompare(b.product, "pt-BR"));
  doc.setProperties({ title: `Pedido - ${customer}`, author: "Order Workbench" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const companyLines = companyName.trim()?doc.splitTextToSize(upper(companyName.trim()),pageWidth-70) as string[]:[];
  if(companyLines.length)doc.text(companyLines,12,14);
  const titleY = companyLines.length?14+(companyLines.length-1)*5+7:14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("PEDIDO PARA SEPARAÇÃO", 12, titleY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const customerLines = doc.splitTextToSize(customer, pageWidth-24) as string[];
  const customerY=Math.max(titleY+11,34);
  doc.text(customerLines, 12, customerY);
  const bottom = customerY + (customerLines.length - 1) * 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(printedAt.toLocaleDateString("pt-BR"), pageWidth-12, 14, { align: "right" });
  doc.text(printedAt.toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"}), pageWidth-12, 19, { align: "right" });
  doc.text(`${items.length} ${items.length === 1 ? "ITEM" : "ITENS"}`, pageWidth-12, 24, { align: "right" });
  autoTable(doc, {
    startY: bottom + 15,
    margin: { top: 8, right: 8, bottom: 12, left: 8 },
    head: [["PRODUTO", "QUANT.", "UNIDADE", "PESO REAL", "OBSERVAÇÃO"]],
    body: items.map(item => [upper(item.product), decimal(item.quantity), formatUnit(item.unit), decimal(item.actualWeight), upper(item.note)]),
    theme: "grid",
    styles: { font: "helvetica", fontStyle: "bold", fontSize: 11.5, minCellHeight:26*25.4/96, cellPadding:{top:5*25.4/96,bottom:5*25.4/96,left:6*25.4/96,right:6*25.4/96}, overflow: "linebreak", halign: "center", valign: "middle", textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 1.6*25.4/96 },
    headStyles: { fillColor: [255, 255, 255], textColor: [17, 17, 17], fontStyle: "bold" },
    columnStyles: Object.fromEntries([.38,.09,.12,.18,.23].map((ratio,index)=>[index,{cellWidth:(pageWidth-16)*ratio}])),
    rowPageBreak: "avoid",
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Order Workbench", pageWidth/2, pageHeight-8, {align: "center"});
    },
  });
  return doc;
}
