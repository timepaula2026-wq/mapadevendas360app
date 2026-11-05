import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(resolve(__dirname, "../pages/ChatBot.tsx"), "utf-8");

describe("ChatBot route /chatbot (IA do Consórcio)", () => {
  it("tem as duas abas: Pergunte IA e Vendedor IA", () => {
    expect(source).toContain("💬 Pergunte IA");
    expect(source).toContain("🎯 Vendedor IA");
  });

  it("bloqueia envio, voz e simulados quando a IA não está liberada", () => {
    expect(source.match(/requireAi\(\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("mostra o aviso de assinatura quando a IA está desligada", () => {
    expect(source).toContain("!AI_ENABLED");
    expect(source).toContain("AI_LOCKED_MESSAGE");
  });
});
