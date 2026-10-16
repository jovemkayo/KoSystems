import type { Order } from "../domain/types";
import { apiResponse } from "../auth/api";
const upper = (text: string) => text.toLocaleUpperCase("pt-BR");
export async function shareOrderPdf(order: Order): Promise<"shared" | "saved"> {
  const response = await apiResponse("/api/tools/export", { ...order });
  const filename = `pedido-${(order.customer || "cliente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cliente"}.pdf`;
  const file = new File([await response.arrayBuffer()], filename, { type: "application/pdf" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Pedido - ${upper(order.customer || "Cliente")}` });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      // A browser may advertise file sharing but deny it; offer the download.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "saved";
}
