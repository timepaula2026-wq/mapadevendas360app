import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      target_user_id,
      email,
      display_name,
      phone,
      unit,
      cpf,
    } = body || {};

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualiza e-mail em auth (se fornecido)
    if (email && typeof email === "string") {
      const trimmed = email.trim().toLowerCase();
      const { error: authErr } = await admin.auth.admin.updateUserById(target_user_id, {
        email: trimmed,
        email_confirm: true,
      });
      if (authErr) {
        return new Response(JSON.stringify({ error: `Erro ao atualizar e-mail: ${authErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Atualiza profile
    const profileUpdate: Record<string, unknown> = {};
    if (email !== undefined) profileUpdate.email = String(email).trim().toLowerCase();
    if (display_name !== undefined) profileUpdate.display_name = display_name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (unit !== undefined) profileUpdate.unit = unit;
    if (cpf !== undefined) profileUpdate.cpf = cpf;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: pErr } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", target_user_id);
      if (pErr) {
        return new Response(JSON.stringify({ error: `Erro ao atualizar perfil: ${pErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});