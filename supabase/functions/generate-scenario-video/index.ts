import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCENARIO_TITLES: Record<string, string> = {
  prospeccao: "Prospecção (cold call inicial)",
  agendamento: "Agendamento de reunião",
  reuniao: "Reunião de apresentação de consórcio",
  fechamento: "Fechamento de venda",
  objecoes: "Treino de objeções fortes",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenario, roteiro } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const title = SCENARIO_TITLES[scenario] ?? "Vendas de consórcio Ademicon";

    const systemPrompt = `Você é um diretor criativo de vídeos curtos de treinamento de vendas para a Ademicon (consórcios).
Produza um mini-vídeo (3 cenas) em formato roteiro/storyboard sobre o cenário "${title}".
Cada cena deve ter:
- title: rótulo curto (2-4 palavras)
- narration: 2-3 frases curtas em pt-BR, tom realista de vendedor experiente, foco em técnica prática
- visual: descrição visual em inglês para gerar imagem (estilo fotográfico cinematográfico, escritório/ambiente brasileiro, profissional)
Inclua um hook no início e um call-to-action final dentro das narrations.
${roteiro ? `\nUse este roteiro do consultor como base:\n"""${String(roteiro).slice(0, 4000)}"""` : ""}`;

    const scriptResp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie o roteiro do vídeo curto para "${title}".` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "scenario_video",
              description: "Roteiro de mini-vídeo de treino",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        narration: { type: "string" },
                        visual: { type: "string" },
                      },
                      required: ["title", "narration", "visual"],
                    },
                  },
                },
                required: ["title", "scenes"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "scenario_video" } },
      }),
    });

    if (!scriptResp.ok) {
      const t = await scriptResp.text();
      console.error("script err", scriptResp.status, t);
      return new Response(JSON.stringify({ error: scriptResp.status === 429 ? "Limite de uso temporário. Tente em alguns minutos." : scriptResp.status === 402 ? "Créditos esgotados na IA. Adicione créditos na Lovable." : "Erro ao gerar roteiro" }), {
        status: scriptResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scriptData = await scriptResp.json();
    const args = scriptData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const scenes = (parsed?.scenes ?? []).slice(0, 3);

    // Generate image for each scene in parallel
    const imgResults = await Promise.all(
      scenes.map(async (s: any) => {
        try {
          const r = await fetch(AI_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                { role: "user", content: `Cinematic photo, 16:9, professional Brazilian sales office. ${s.visual}` },
              ],
              modalities: ["image", "text"],
            }),
          });
          const d = await r.json();
          const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
          return url;
        } catch (e) {
          console.error("img err", e);
          return null;
        }
      })
    );

    const final = {
      title: parsed?.title ?? title,
      scenes: scenes.map((s: any, i: number) => ({
        title: s.title,
        narration: s.narration,
        imageUrl: imgResults[i],
      })),
    };

    return new Response(JSON.stringify(final), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gen-scenario-video err", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});