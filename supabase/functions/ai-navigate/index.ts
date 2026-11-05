import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Fallback quando icon_grid_order não tem override (mesma lista do código do app)
const DEFAULT_GRID_SECTIONS = [
  { id: "trilha", label: "Trilha do Iniciante", route: "/trilha" },
  { id: "acelerador72h", label: "Acelerador 72h", route: "/acelerador-72h" },
  { id: "vendas", label: "Central de Vendas & CRM", route: "/vendas" },
  { id: "ferramentas", label: "Acessos de Ferramentas", route: "/ferramentas" },
  { id: "treinamentos", label: "Treinamentos", route: "/trainings" },
  { id: "carreira", label: "Plano de Carreira", route: "/carreira" },
  { id: "apresentacao", label: "Apresentação de Produtos", route: "/apresentacao" },
  { id: "sorteios", label: "Sorteios & Comunicados", route: "/sorteios" },
  { id: "credito", label: "Liberação de Crédito", route: "/credito" },
  { id: "jornada", label: "Jornada Impacto", route: "/jornada" },
  { id: "equipe", label: "Gestão de Equipe", route: "/equipe" },
  { id: "cliente", label: "Área do Cliente", route: "/cliente" },
  { id: "administrativo", label: "Gestão de Performance 360", route: "/administrativo" },
  { id: "agenda", label: "Agenda Online", route: "/agenda" },
  { id: "paula", label: "Fale com a Paula", route: "/fale-com-paula" },
  { id: "comissao", label: "Comissão", route: "/vendas?calc=1" },
  { id: "lideres", label: "Escola de Líderes", route: "/lideres" },
  { id: "planejamento", label: "Planejamento", route: "/planejamento" },
  { id: "analise", label: "Plataforma de Análise", route: "/analise" },
  { id: "loja", label: "Loja", route: "/loja" },
  { id: "locacao", label: "Locação de Materiais", route: "/locacao" },
  { id: "presenca", label: "Presença Treinamentos", route: "/presenca-treinamentos" },
];

type Candidate =
  | { kind: "section"; label: string; route: string }
  | { kind: "training"; label: string; route: string }
  | {
      kind: "content";
      label: string;
      id: string;
      type: string;
      url: string | null;
      youtube_id: string | null;
      description: string | null;
      allow_download: boolean;
    };

let cached: { candidates: Candidate[]; listText: string; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadCatalog(): Promise<{ candidates: Candidate[]; listText: string }> {
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached;
  }
  const supa = createClient(supabaseUrl, serviceKey);
  const [iconRes, contentRes, trainingRes] = await Promise.all([
    supa.from("icon_grid_order").select("id, custom_label, route, visible").eq("visible", true),
    supa
      .from("section_contents")
      .select("id, title, description, type, url, youtube_id, allow_download")
      .limit(400),
    supa.from("trainings").select("id, title").limit(100),
  ]);

  const candidates: Candidate[] = [];

  // Seções da home: mescla overrides do banco com os padrões do código
  const overrides = new Map((iconRes.data || []).map((r: any) => [r.id, r]));
  const seen = new Set<string>();
  DEFAULT_GRID_SECTIONS.forEach((s) => {
    const o = overrides.get(s.id);
    if (o && o.visible === false) return;
    candidates.push({ kind: "section", label: (o?.custom_label || s.label) as string, route: (o?.route || s.route) as string });
    seen.add(s.id);
  });
  (iconRes.data || []).forEach((r: any) => {
    if (seen.has(r.id) || !r.route || !r.custom_label) return;
    candidates.push({ kind: "section", label: r.custom_label, route: r.route });
  });

  (trainingRes.data || []).forEach((t: any) => {
    candidates.push({ kind: "training", label: t.title, route: `/training/${t.id}` });
  });

  (contentRes.data || []).forEach((c: any) => {
    candidates.push({
      kind: "content",
      label: c.title,
      id: c.id,
      type: c.type,
      url: c.url,
      youtube_id: c.youtube_id,
      description: c.description,
      allow_download: !!c.allow_download,
    });
  });

  const listText = candidates
    .map((c, i) => {
      if (c.kind === "content") {
        return `${i + 1}) [material] ${c.label}${c.description ? " — " + c.description.slice(0, 60) : ""}`;
      }
      if (c.kind === "training") return `${i + 1}) [treinamento] ${c.label}`;
      return `${i + 1}) [aba] ${c.label}`;
    })
    .join("\n");

  cached = { candidates, listText, ts: Date.now() };
  return cached;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(JSON.stringify({ kind: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { candidates, listText } = await loadCatalog();

    const systemPrompt = `Você é o roteador interno do app Mapa de Vendas. Dada a pergunta/pedido de um consultor e uma lista numerada de destinos do app, responda APENAS com o número do destino mais relevante. Se nenhum item da lista atender bem ao pedido, responda 0. Não escreva mais nada além do número.

Lista de destinos:
${listText}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query.slice(0, 500) },
        ],
        stream: false,
        max_tokens: 8,
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ kind: "none", error: "ai_error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content || "";
    const match = raw.match(/\d+/);
    const idx = match ? parseInt(match[0], 10) : 0;

    if (!idx || idx < 1 || idx > candidates.length) {
      return new Response(JSON.stringify({ kind: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chosen = candidates[idx - 1];
    return new Response(JSON.stringify(chosen), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-navigate error:", e);
    return new Response(
      JSON.stringify({ kind: "none", error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
