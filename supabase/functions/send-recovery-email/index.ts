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
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const { email, redirectTo } = await req.json();
    if (!email) return json({ error: "E-mail obrigatório" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Gera o link de redefinição de senha via Admin API
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: redirectTo || "https://mapadevendas360.com.br/auth/callback",
      },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkErr);
      // Se o usuário não existe, retorna ok mesmo assim (não revelar se e-mail existe)
      return json({ ok: true });
    }

    const recoveryLink = linkData.properties.action_link;

    // Envia o email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Mapa de Vendas 360 <noreply@mapadevendas360.com.br>",
        to: [email.trim().toLowerCase()],
        subject: "Redefinição de senha — Mapa de Vendas 360",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Mapa de Vendas 360</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #111827; font-size: 18px; margin-bottom: 12px;">Redefinição de senha</h2>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
              </p>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${recoveryLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                  Redefinir senha
                </a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                Este link expira em 24 horas. Se você não solicitou a redefinição, ignore este e-mail.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">Mapa de Vendas 360 — Time Paula Batista</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return json({ error: "Falha ao enviar e-mail" }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("send-recovery-email failed:", e);
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
