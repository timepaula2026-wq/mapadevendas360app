import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractTrainingPath = (value: string): string | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const urlMatch = raw.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/training-files\/([^?]+)/);
  const path = urlMatch ? decodeURIComponent(urlMatch[1]) : raw;

  if (!path || path.includes("..") || path.startsWith("/") || path.includes("\\")) return null;
  return path;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: "Configuração do backend indisponível" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;

    if (userError || !user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile } = await admin
      .from("profiles")
      .select("approved")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!profile?.approved && !roleRow) return json({ error: "Acesso não aprovado" }, 403);

    const body = await req.json();
    const path = extractTrainingPath(String(body?.path || body?.url || ""));
    const requestedExpires = Number(body?.expiresIn || 3600);
    const expiresIn = Number.isFinite(requestedExpires)
      ? Math.max(60, Math.min(86400, Math.round(requestedExpires)))
      : 3600;

    if (!path) return json({ error: "Arquivo inválido" }, 400);

    const { data, error } = await admin.storage
      .from("training-files")
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) return json({ error: error?.message || "Arquivo não encontrado" }, 404);

    return json({ signedUrl: data.signedUrl, expiresIn });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return json({ error: message }, 500);
  }
});