import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { groupPdfText } from "./group-pdf-text";
import type { PdfTextItem } from "./group-pdf-text";

export function validatePdfFile(file: { name: string; size: number }): void {
  if (!file.name.toLowerCase().endsWith(".pdf"))
    throw new Error("Escolha um arquivo PDF.");
  if (file.size > 10 * 1024 * 1024)
    throw new Error("O PDF deve ter até 10 MiB.");
}
export async function extractPdfBytes(
  bytes: Uint8Array,
  signal?: AbortSignal,
): Promise<string> {
  if (signal?.aborted) throw new Error("Leitura cancelada.");
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new Error("O PDF deve ter até 10 MiB.");
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-")
    throw new Error("Arquivo PDF inválido.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (signal?.aborted) throw new Error("Leitura cancelada.");
  const browser = typeof window !== "undefined";
  if (browser) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const resources = browser
    ? new URL("pdf-assets/", document.baseURI).href
    : process.cwd().replaceAll("\\", "/") + "/node_modules/pdfjs-dist/";
  const task = pdfjs.getDocument({
    data: bytes,
    stopAtErrors: true,
    standardFontDataUrl: resources + "standard_fonts/",
    cMapUrl: resources + "cmaps/",
    cMapPacked: true,
    wasmUrl: resources + "wasm/",
    useSystemFonts: true,
    verbosity: 0,
  });
  const cancel = () => {
    void task.destroy().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 30) throw new Error("O PDF deve ter até 30 páginas.");
    const pages: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      if (signal?.aborted) throw new Error("Leitura cancelada.");
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const text = groupPdfText(
        content.items.flatMap((item) =>
          "str" in item ? [{ str: item.str, transform: item.transform,width:item.width }] : [],
        ),
      );
      pages.push(text);
      page.cleanup();
      if (pages.join("\n").length > 10000)
        throw new Error("O PDF excede 10.000 caracteres.");
    }
    const text = pages.join("\n").trim();
    if (!text)
      throw new Error(
        "Este PDF não tem texto selecionável. PDFs digitalizados precisam de OCR.",
      );
    if (text.split(/\r?\n/).filter((line) => line.trim()).length > 100)
      throw new Error("O PDF excede 100 linhas preenchidas.");
    return text;
  } catch (error) {
    if (signal?.aborted) throw new Error("Leitura cancelada.");
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error(
        "O PDF está protegido por senha. Use uma cópia desbloqueada.",
      );
    if (
      error instanceof Error &&
      ["InvalidPDFException", "MissingPDFException"].includes(error.name)
    )
      throw new Error("Não foi possível ler este PDF inválido.");
    throw error;
  } finally {
    signal?.removeEventListener("abort", cancel);
    await task.destroy();
  }
}
export async function extractPdf(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  validatePdfFile(file);
  return extractPdfBytes(new Uint8Array(await file.arrayBuffer()), signal);
}
