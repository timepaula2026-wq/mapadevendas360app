import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const source = readFileSync(
  resolve(__dirname, "../pages/ChatBot.tsx"),
  "utf-8"
);

describe("ChatBot route /chatbot", () => {
  it("sempre força askOnly = true (modo Pergunte IA)", () => {
    expect(source).toMatch(/const\s+askOnly\s*=\s*true\s*;/);
  });

  it("não deriva askOnly de searchParams (mode=ask)", () => {
    expect(source).not.toMatch(/askOnly\s*=\s*searchParams/);
    expect(source).not.toMatch(/mode.*===\s*["']ask["']/);
  });

  it("inicializa o estado de modo como 'chat' quando askOnly", () => {
    expect(source).toMatch(/useState<ChatMode>\(askOnly \? "chat" : "simulados"\)/);
  });

  it("renderiza o título 'Pergunte IA' e nunca 'Vendedor IA' no fluxo padrão", () => {
    // Título depende de askOnly; com askOnly=true, sempre "Pergunte IA"
    expect(source).toMatch(/askOnly \? "Pergunte IA" : "Vendedor IA"/);
  });

  it("oculta as abas de Vendedor IA quando askOnly", () => {
    expect(source).toMatch(/!askOnly/);
  });
});