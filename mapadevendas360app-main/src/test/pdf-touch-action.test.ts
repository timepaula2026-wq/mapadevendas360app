import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Garantias para iOS/Safari no visualizador de PDF:
 * - O container e os iframes do PDF DEVEM definir touchAction: "pan-y" para
 *   bloquear o pinch-zoom (que abria o PDF em zoom e impedia rolagem).
 * - O renderer nativo do iOS é trocado pelo Google Docs Viewer para garantir
 *   página inteira + rolagem suave.
 */
describe("ContentViewerModal — bloqueios de gesto no PDF (iOS)", () => {
  const source = readFileSync(
    resolve(__dirname, "../components/ContentViewerModal.tsx"),
    "utf8"
  );

  it("aplica touchAction pan-y em todos os iframes/containers de PDF", () => {
    const occurrences = source.match(/touchAction:\s*"pan-y"/g) ?? [];
    // container do PDF + 3 iframes (gview, ios, native)
    expect(occurrences.length).toBeGreaterThanOrEqual(4);
  });

  it("usa Google Docs Viewer (gview) por padrão no iOS", () => {
    expect(source).toMatch(/setUseFallback\(isIOS\)/);
    expect(source).toMatch(/docs\.google\.com\/gview/);
  });

  it("detecta iOS via userAgent (iPad/iPhone/iPod) excluindo MSStream", () => {
    expect(source).toMatch(/iPad\|iPhone\|iPod/);
    expect(source).toMatch(/MSStream/);
  });
});

describe("ImageZoomModal — fechamento por toque fora", () => {
  const source = readFileSync(
    resolve(__dirname, "../components/ImageZoomModal.tsx"),
    "utf8"
  );

  it("ao tocar fora da imagem com zoom, reseta para 100% antes de fechar", () => {
    // A lógica deve chamar reset() quando scale > 1, e onClose() caso contrário.
    expect(source).toMatch(/scale\s*>\s*1[\s\S]{0,80}reset\(\)/);
    expect(source).toMatch(/onClose\(\)/);
  });

  it("desativa gestos de scroll do navegador no palco com touch-none", () => {
    expect(source).toMatch(/touch-none/);
  });
});