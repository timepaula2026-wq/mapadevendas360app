import * as pdfjs from "pdfjs-dist";
// @ts-ignore - vite ?url import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

(pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File, maxChars = 12000): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(" ");
    out += text + "\n\n";
    if (out.length >= maxChars) break;
  }
  return out.trim().slice(0, maxChars);
}
