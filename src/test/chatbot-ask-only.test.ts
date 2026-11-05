import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "../pages/ChatBot.tsx"), "utf-8");

describe("ChatBot route /chatbot (IA do Consórcio)", () => {
  it("tem as duas abas: Pergunte IA e Vendedor IA", () => {
    expect(source).toContain("💬 Pergunte IA");
    expect(source).toContain("🎯 Vendedor IA");
  });

  it("só exige assinatura para gerar imagem; o resto funciona no modo gratuito", () => {
    expect(source.match(/requireAi\(\)/g)?.length).toBe(1);
    expect(source).toContain("offlineAnswer");
    expect(source).toContain("offlineScenarioReply");
  });

  it("mostra o aviso de modo gratuito quando a IA está desligada", () => {
    expect(source).toContain("!AI_ENABLED");
    expect(source).toContain("Modo gratuito");
  });
});
