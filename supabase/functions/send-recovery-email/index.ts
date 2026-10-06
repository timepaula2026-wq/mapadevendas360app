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

// Gera senha aleatória de 10 chars: letras + números
function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pwd = "";
  const array = new Uint8Array(10);
  crypto.getRandomValues(array);
  for (const byte of array) {
    pwd += chars[byte % chars.length];
  }
  return pwd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const { email } = await req.json();
    if (!email) return json({ error: "E-mail obrigatório" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const normalizedEmail = email.trim().toLowerCase();

    // Busca o usuário pelo email
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) {
      console.error("listUsers error:", listErr);
      return json({ ok: true }); // não revelar se e-mail existe
    }

    const user = listData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      // Não revelar que e-mail não existe
      return json({ ok: true });
    }

    // Gera senha aleatória e atualiza no Supabase
    const newPassword = generatePassword();
    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: { must_change_password: true },
    });

    if (updateErr) {
      console.error("updateUserById error:", updateErr);
      return json({ error: "Falha ao redefinir senha" }, 500);
    }

    // Envia a senha por email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Mapa de Vendas 360 <noreply@mapadevendas360.com.br>",
        to: [normalizedEmail],
        subject: "Sua nova senha — Mapa de Vendas 360",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Mapa de Vendas 360</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #111827; font-size: 18px; margin-bottom: 12px;">Sua nova senha temporária</h2>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Recebemos uma solicitação de recuperação de senha. Use a senha abaixo para entrar no aplicativo:
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 6px; color: #6b7280; font-size: 12px;">Senha temporária</p>
                <p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #111827; font-family: monospace;">${newPassword}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                Após entrar, você será solicitado a criar uma nova senha.
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                Se você não solicitou a recuperação, entre em contato com o suporte.
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

