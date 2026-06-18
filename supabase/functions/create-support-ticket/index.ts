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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const message = String(body?.message || "").trim();
    const unit = body?.unit ? String(body.unit).trim() : null;
    const photo_url = body?.photo_url ? String(body.photo_url) : null;

    if (!name || !email || !message) {
      return json({ error: "Preencha nome, e-mail e descrição do problema" }, 400);
    }

    let user_id: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader && !authHeader.endsWith(anonKey)) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      user_id = data.user?.id ?? null;
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
      .from("support_tickets")
      .insert({ name, email, unit, message, photo_url, user_id })
      .select("id")
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return json({ error: message }, 500);
  }
});