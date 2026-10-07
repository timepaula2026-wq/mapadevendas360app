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
    console.log("[admin-update-user] body recebido:", JSON.stringify(body));

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

    // Atualiza e-mail em auth apenas quando mudou, evitando falha desnecessária
    if (email && typeof email === "string") {
      const trimmed = email.trim().toLowerCase();
      console.log("[admin-update-user] atualizando email para:", trimmed);

      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        console.log("[admin-update-user] email inválido:", trimmed);
        return new Response(JSON.stringify({ error: `E-mail inválido: ${trimmed}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUser, error: getAuthErr } = await admin.auth.admin.getUserById(target_user_id);
      if (getAuthErr) {
        console.error("[admin-update-user] erro ao buscar usuário:", getAuthErr);
        return new Response(JSON.stringify({ error: `Erro ao localizar usuário: ${getAuthErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const currentEmail = authUser?.user?.email?.trim().toLowerCase();
      const alreadyConfirmed = Boolean(authUser?.user?.email_confirmed_at || authUser?.user?.confirmed_at);

      console.log("[admin-update-user] email atual:", currentEmail, "confirmado:", alreadyConfirmed);

      if (trimmed !== currentEmail || !alreadyConfirmed) {
        console.log("[admin-update-user] chamando admin.auth.admin.updateUserById...");
        const { error: authErr } = await admin.auth.admin.updateUserById(target_user_id, {
          ...(trimmed !== currentEmail ? { email: trimmed } : {}),
          email_confirm: true,
        });
        if (authErr) {
          console.error("[admin-update-user] erro ao atualizar auth email:", authErr.message, authErr);
          return new Response(JSON.stringify({ error: `Erro ao atualizar e-mail: ${authErr.message}` }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("[admin-update-user] email auth atualizado com sucesso");
      } else {
        console.log("[admin-update-user] email não mudou e já está confirmado, pulando auth update");
      }
    }

    // Atualiza profile (apenas colunas que existem na tabela)
    const profileUpdate: Record<string, unknown> = {};
    if (display_name !== undefined) profileUpdate.display_name = display_name;
    if (phone !== undefined) profileUpdate.phone = phone;
    if (cpf !== undefined) profileUpdate.cpf = cpf;
    // Nota: profiles não tem coluna "email" nem "unit" — email fica só no auth.users

    console.log("[admin-update-user] profileUpdate:", JSON.stringify(profileUpdate));

    if (Object.keys(profileUpdate).length > 0) {
      const { error: pErr } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", target_user_id);
      if (pErr) {
        console.error("[admin-update-user] erro ao atualizar profile:", pErr.message, pErr);
        return new Response(JSON.stringify({ error: `Erro ao atualizar perfil: ${pErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[admin-update-user] profile atualizado com sucesso");
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-update-user] erro inesperado:", String((e as any)?.message || e), e);
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
