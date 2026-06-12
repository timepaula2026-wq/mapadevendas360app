import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const okResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { email } = await req.json().catch(() => ({ email: "" }));
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) return okResponse();

    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", normalizedEmail)
      .eq("approved", true)
      .maybeSingle();

    if (!profile?.user_id) return okResponse();

    await admin.auth.admin.updateUserById(profile.user_id, {
      email_confirm: true,
    });

    return okResponse();
  } catch (e) {
    console.error("release-approved-email failed", e);
    return okResponse();
  }
});