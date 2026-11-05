import { describe, it, expect, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/SimuladosPanel", () => ({ SCENARIOS: [] }));

import { answerFromFaq, buildTurns, buildFeedback, questionsFromRoteiro, SCRIPTED } from "@/lib/iaOffline";
import { tokenize } from "@/lib/localSearch";

describe("IA do Consórcio — modo gratuito", () => {
  it("responde perguntas frequentes pelo atalho e por frases parecidas", async () => {
    expect(await answerFromFaq("O que é consórcio?")).toContain("Banco Central");
    expect(await answerFromFaq("como funciona o lance embutido")).toContain("Lance embutido");
    expect(await answerFromFaq("consórcio é mais barato que financiamento?")).toContain("Financiamento");
    expect(await answerFromFaq("quais os níveis da carreira")).toContain("Supervisor");
    expect(await answerFromFaq("o que é o acelerador 72h")).toContain("Acelerador 72h");
  });

  it("não inventa resposta para assunto desconhecido", async () => {
    expect(await answerFromFaq("previsão do tempo amanhã")).toBeNull();
  });

  it("normaliza acentos e plurais na busca", () => {
    expect(tokenize("Apresentações de Imóveis")).toEqual(tokenize("apresentacao imovel"));
  });

  it("simulado: cada cenário tem resposta modelo para a abertura e todas as falas", () => {
    for (const [key, sc] of Object.entries(SCRIPTED)) {
      expect(sc.modelAnswers.length, key).toBe(sc.lines.length + 1);
    }
  });

  it("simulado: feedback dá nota maior para boas respostas", () => {
    const turns = buildTurns("agendamento", "abertura");
    const boas = [
      "Consigo sim, mas numa conversa de 20 minutos eu monto a sua simulação. Qual o melhor horário pra você?",
      "Entendo, por isso é rapidinho: tenho terça às 19h ou quinta às 12h, qual encaixa melhor pra você?",
      "O objetivo é entender seu objetivo e mostrar os números da estratégia mais barata pra chegar lá. Faz sentido?",
      "Leva uns 20 minutos no máximo, bem objetivo e sem compromisso nenhum com você, combinado?",
      "Fechado então, fica confirmado quinta às 12h e eu te mando o lembrete por WhatsApp no dia.",
    ];
    const ruins = ["ok", "tá", "beleza", "sim", "tchau"];
    const notaBoa = Number(buildFeedback("agendamento", boas, turns).match(/nota (\d+)/)![1]);
    const notaRuim = Number(buildFeedback("agendamento", ruins, turns).match(/nota (\d+)/)![1]);
    expect(notaBoa).toBeGreaterThanOrEqual(8);
    expect(notaRuim).toBeLessThanOrEqual(2);
  });

  it("extrai perguntas do roteiro em PDF", () => {
    const qs = questionsFromRoteiro("Introdução.\n- E se eu atrasar uma parcela, o que acontece?\nTexto. Qual a taxa de administração do grupo?");
    expect(qs).toEqual(["E se eu atrasar uma parcela, o que acontece?", "Qual a taxa de administração do grupo?"]);
  });
});
