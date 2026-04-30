import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Garantias para iOS/Safari:
 * - O viewport DEVE travar o pinch-zoom da página inteira
 *   (initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no).
 * - Sem isso, a tela inicial e os modais "andam" ao toque no iPhone.
 */
describe("index.html viewport meta (iOS pinch-zoom lock)", () => {
  const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");
  const match = html.match(/<meta\s+name="viewport"\s+content="([^"]+)"\s*\/?>/i);
  const content = match?.[1] ?? "";

  it("declara um meta viewport", () => {
    expect(match, "meta viewport ausente em index.html").toBeTruthy();
  });

  it("trava o zoom da página com user-scalable=no", () => {
    expect(content).toMatch(/user-scalable\s*=\s*no/i);
  });

  it("define minimum-scale=1.0 e maximum-scale=1.0", () => {
    expect(content).toMatch(/minimum-scale\s*=\s*1(\.0)?/i);
    expect(content).toMatch(/maximum-scale\s*=\s*1(\.0)?/i);
  });

  it("usa viewport-fit=cover para respeitar o notch do iPhone", () => {
    expect(content).toMatch(/viewport-fit\s*=\s*cover/i);
  });
});