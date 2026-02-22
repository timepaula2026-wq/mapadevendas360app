import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual do app Mapa de Vendas da Ademicon, a maior administradora independente de consórcios do Brasil.

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            { role: "system", content: SYSTEM_PROMPT },
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
