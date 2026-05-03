import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PROMPT = `Você é o **Vendedor IA** do app Mapa de Vendas da Ademicon, a maior administradora independente de consórcios do Brasil.

Seu papel é ajudar consultores e clientes com dúvidas sobre:

**Consórcio Ademicon:**
- O que é consórcio e como funciona
- Modalidades: imóveis, automóveis, serviços, investimentos
- Como funciona a contemplação (lance e sorteio)
- Taxas de administração e fundo de reserva
- Vantagens do consórcio vs financiamento
- Processo de adesão e documentação necessária
- Uso da carta de crédito contemplada
- Transferência de cotas e desistência

**Funcionalidades do App Mapa de Vendas:**
- Trilha do Iniciante: módulos de onboarding para novos consultores
- Central de Vendas & CRM: gestão de vendas e clientes
- Treinamentos: vídeos, PDFs e materiais de capacitação
- Plano de Carreira: níveis e metas de progressão
- Apresentação de Produtos: materiais para apresentar aos clientes
- Sorteios & Comunicados: informações sobre assembleias e comunicados
- Liberação de Crédito: acompanhamento de cartas contempladas
- Jornada Impacto: metas e desafios da equipe
- Gestão de Equipe: gerenciamento de time
- Área do Cliente: acompanhamento de contratos
- Plataforma de Análise: métricas e dashboards

**Diretrizes:**
- Responda sempre em português brasileiro
- Seja objetivo, claro e profissional
- Use emojis com moderação para tornar a conversa amigável
- Se não souber algo específico sobre a Ademicon, diga que pode ajudar com informações gerais sobre consórcios
- Nunca invente dados financeiros ou taxas específicas — oriente o cliente a consultar seu consultor ou o site oficial
- Sempre incentive o uso das ferramentas disponíveis no app`;

const SCENARIO_PROMPTS: Record<string, string> = {
  prospeccao: `### MODO SIMULADO: PROSPECÇÃO (Cold Call / Primeiro Contato)
Você vai simular um **CLIENTE** sendo prospectado pela primeira vez por telefone.
- Comece curto, levemente desconfiado ("Alô? Quem fala?").
- Reaja de forma realista ao que o consultor disser. Se ele se apresentar bem, abra espaço; se for genérico, resista.
- Solte 1 ou 2 objeções típicas de prospecção: "não tenho tempo", "já tenho consórcio", "como conseguiu meu número?".
- Após 4–6 trocas, encerre a simulação com um bloco **📊 Feedback do Vendedor IA** avaliando: abertura, rapport, descoberta de necessidade, próximo passo. Dê 1 dica prática.`,
  agendamento: `### MODO SIMULADO: AGENDAMENTO DE REUNIÃO
Você simula um **CLIENTE** que já demonstrou interesse mas ainda resiste a marcar reunião.
- Levante objeções clássicas de agenda: "manda por WhatsApp", "não sei se vou ter tempo", "qual o objetivo?".
- Exija que o consultor proponha 2 opções de horário e venda o valor da reunião.
- Após 4–6 trocas, finalize com **📊 Feedback** avaliando: clareza do propósito, oferta de horários, confirmação e gancho.`,
  reuniao: `### MODO SIMULADO: REUNIÃO DE APRESENTAÇÃO
Você simula um **CLIENTE** numa reunião presencial/virtual considerando consórcio Ademicon (ex: imóvel R$ 300 mil).
- Faça perguntas reais: prazo, parcela, lance, contemplação, taxa de adm vs juros de financiamento.
- Cobre exemplos numéricos concretos do consultor.
- Após 5–7 trocas, finalize com **📊 Feedback** avaliando: descoberta, proposta de valor, uso de números, condução para o fechamento.`,
  fechamento: `### MODO SIMULADO: FECHAMENTO DE VENDA
Você simula um **CLIENTE** quase decidido, mas que ainda hesita na hora de assinar.
- Use travas reais: "preciso pensar", "vou conversar com minha esposa", "e se eu não for contemplado?", "e se eu perder o emprego?".
- Dê pistas de compra se o consultor aplicar bem técnicas de fechamento (alternativa, urgência real, garantia).
- Após 4–6 trocas, finalize com **📊 Feedback** avaliando: leitura do momento, técnica de fechamento usada, ancoragem, próximo passo concreto.`,
  objecoes: `### MODO SIMULADO: TREINO DE OBJEÇÕES
Você simula um **CLIENTE** que dispara objeções fortes de consórcio, uma a cada turno:
1) "Consórcio é furada, posso não ser contemplado nunca."
2) "É mais caro que financiamento."
3) "Já tenho consórcio em outra administradora."
4) "Não confio em administradora, prefiro banco."
5) "Não tenho dinheiro pra mais uma parcela agora."
- Avalie cada resposta e responda como cliente real.
- Após 5 objeções, finalize com **📊 Feedback** detalhado por objeção (técnica usada, o que melhorar) e nota geral.`,
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let cachedContext: { text: string; ts: number } | null = null;
const CONTEXT_TTL_MS = 5 * 60 * 1000;

async function loadAppContext(): Promise<string> {
  if (cachedContext && Date.now() - cachedContext.ts < CONTEXT_TTL_MS) {
    return cachedContext.text;
  }
  try {
    const supa = createClient(supabaseUrl, serviceKey);
    const [icons, contents, tabs] = await Promise.all([
      supa.from("icon_grid_order").select("id, custom_label, route").eq("visible", true).order("sort_order"),
      supa.from("section_contents").select("section_id, title, description, type, url").limit(200),
      supa.from("section_tabs").select("section_id, title").order("sort_order"),
    ]);
    const lines: string[] = ["**Conteúdos atuais do app Mapa de Vendas:**"];
    if (icons.data?.length) {
      lines.push("Seções da home: " + icons.data.map((i: any) => i.custom_label || i.id).join(", "));
    }
    if (tabs.data?.length) {
      const byS: Record<string, string[]> = {};
      tabs.data.forEach((t: any) => { (byS[t.section_id] ||= []).push(t.title); });
      Object.entries(byS).forEach(([s, ts]) => lines.push(`Abas em ${s}: ${ts.join(", ")}`));
    }
    if (contents.data?.length) {
      const byS: Record<string, string[]> = {};
      contents.data.forEach((c: any) => {
        (byS[c.section_id] ||= []).push(`${c.title}${c.description ? " — " + c.description.slice(0, 80) : ""}`);
      });
      Object.entries(byS).slice(0, 20).forEach(([s, items]) =>
        lines.push(`Materiais em ${s}: ${items.slice(0, 10).join(" | ")}`)
      );
    }
    const text = lines.join("\n");
    cachedContext = { text, ts: Date.now() };
    return text;
  } catch (e) {
    console.error("loadAppContext failed:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, scenario, roteiro } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const appContext = await loadAppContext();
    const scenarioPrompt = scenario && SCENARIO_PROMPTS[scenario] ? "\n\n" + SCENARIO_PROMPTS[scenario] : "";
    const roteiroPrompt =
      scenario && roteiro && typeof roteiro === "string" && roteiro.trim()
        ? `\n\n### ROTEIRO BASE (fornecido pelo consultor)\nUse este roteiro/material como base do cenário simulado. Extraia objeções, perguntas, dores e termos do cliente DIRETAMENTE deste texto. Mantenha-se fiel ao tom e conteúdo. Se o roteiro contradisser instruções padrão do cenário, o roteiro tem prioridade.\n---\n${roteiro.slice(0, 12000)}\n---`
        : "";
    const systemPrompt =
      BASE_PROMPT + (appContext ? "\n\n" + appContext : "") + scenarioPrompt + roteiroPrompt;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao conectar com a IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
