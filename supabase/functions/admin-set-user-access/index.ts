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

    const { target_user_id, approved } = await req.json();
    if (!target_user_id || typeof approved !== "boolean") {
      return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ approved })
      .eq("user_id", target_user_id);

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let warning: string | null = null;

    if (approved) {
      const { data: authUser, error: getAuthError } = await admin.auth.admin.getUserById(target_user_id);
      const user = authUser?.user;
      const alreadyConfirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);

      if (!getAuthError && user && !alreadyConfirmed) {
        const { error: authError } = await admin.auth.admin.updateUserById(target_user_id, {
          email_confirm: true,
        });

        if (authError) {
          console.warn("admin-set-user-access: approved profile, email confirmation skipped", authError.message);
          warning = "Cadastro aprovado. O e-mail não precisou ser confirmado automaticamente; se o acesso falhar, use o botão de liberar e-mail.";
        }
      } else if (getAuthError) {
        console.warn("admin-set-user-access: approved profile, auth user lookup failed", getAuthError.message);
        warning = "Cadastro aprovado, mas não foi possível conferir a confirmação do e-mail.";
      }

      // Send approval email via Resend
      const resendKey = Deno.env.get("RESEND_API_KEY");
      const userEmail = user?.email;
      const isPlaceholder = userEmail?.endsWith("@consultor.local");

      if (resendKey && userEmail && !isPlaceholder) {
        // Get display name from profiles
        const { data: profile } = await admin
          .from("profiles")
          .select("display_name")
          .eq("user_id", target_user_id)
          .maybeSingle();

        const displayName = profile?.display_name || "Consultor(a)";

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Time Paula Batista <noreply@mapadevendas360.com.br>",
            to: [userEmail],
            subject: "✅ Seu cadastro foi aprovado!",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a1a">Olá, ${displayName}! 🎉</h2>
                <p style="color:#444;font-size:16px">
                  Seu cadastro no <strong>Mapa de Vendas</strong> foi aprovado pelo administrador.
                </p>
                <p style="color:#444;font-size:16px">
                  Você já pode acessar normalmente a plataforma com o seu e-mail e senha cadastrados.
                </p>
                <div style="margin:32px 0;text-align:center">
                  <a href="https://mapadevendas360.com.br"
                     style="background:#6366f1;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
                    Acessar o App
                  </a>
                </div>
                <p style="color:#888;font-size:13px">
                  Em caso de dúvidas, entre em contato com seu gestor de unidade.
                </p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                <p style="color:#bbb;font-size:12px;text-align:center">
                  Time Paula Batista — Mapa de Vendas 360
                </p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.warn("admin-set-user-access: email send failed", errBody);
          warning = (warning ? warning + " " : "") + "Cadastro aprovado, mas o e-mail de notificação não pôde ser enviado.";
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, warning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
