/**
 * gestao360-webhook
 *
 * Recebe eventos do Sistema Gestão 360 e sincroniza o acesso no Mapa de Vendas.
 *
 * Eventos suportados:
 *   "consultor_iniciado"  → cria conta (ou aprova existente) + envia email com senha 123456
 *   "consultor_desligado" → bloqueia acesso (approved = false)
 *   "consultor_reativado" → reativa acesso (approved = true) sem redefinir senha
 *
 * Autenticação: header X-Webhook-Secret deve conter GESTAO360_WEBHOOK_SECRET
 *
 * Payload esperado (JSON):
 * {
 *   "evento": "consultor_iniciado" | "consultor_desligado" | "consultor_reativado",
 *   "consultor": {
 *     "nome":      string,   // nome completo
 *     "email":     string,   // email de acesso
 *     "cpf":       string?,  // CPF ou matrícula (opcional)
 *     "unidade":   string?,  // nome da unidade
 *     "atividade": string?   // "iniciante" | "autorizado" | "supervisor" | "gestor" | "secretaria"
 *   }
 * }
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const SENHA_PADRAO = "123456";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Mapeia atividade → role do app_role enum
function atividadeToRole(atividade: string | undefined, hasCpf: boolean): string {
  const a = (atividade ?? "").toLowerCase().trim();
  if (a === "secretaria")  return "secretaria";
  if (a === "gestor")      return "gestor";
  if (a === "supervisor")  return "supervisor";
  if (a === "autorizado")  return "autorizado";
  if (a === "iniciante")   return hasCpf ? "autorizado" : "iniciante";
  return "iniciante"; // padrão seguro
}

async function sendWelcomeEmail(
  resendKey: string,
  email: string,
  nome: string,
  senha: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Time Paula Batista <noreply@mapadevendas360.com.br>",
      to: [email],
      subject: "🎉 Bem-vindo ao Mapa de Vendas!",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">Olá, ${nome}! 🎉</h2>
          <p style="color:#444;font-size:16px">
            Seu acesso ao <strong>Mapa de Vendas 360</strong> foi liberado.
            Use os dados abaixo para entrar no aplicativo:
          </p>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin:20px 0">
            <p style="margin:4px 0;color:#333"><strong>E-mail:</strong> ${email}</p>
            <p style="margin:4px 0;color:#333"><strong>Senha:</strong> ${senha}</p>
          </div>
          <p style="color:#e55;font-size:14px">
            ⚠️ Por segurança, altere sua senha no primeiro acesso.
          </p>
          <div style="margin:32px 0;text-align:center">
            <a href="https://mapadevendas360.com.br"
               style="background:#6366f1;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Acessar o App
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#bbb;font-size:12px;text-align:center">
            Time Paula Batista — Mapa de Vendas 360
          </p>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn("gestao360-webhook: email send failed", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  // --- Autenticação por chave secreta ---
  const webhookSecret = Deno.env.get("GESTAO360_WEBHOOK_SECRET");
  if (webhookSecret) {
    const provided = req.headers.get("x-webhook-secret") ?? "";
    if (provided !== webhookSecret) {
      console.warn("gestao360-webhook: chave inválida");
      return json({ error: "Não autorizado" }, 401);
    }
  } else {
    console.warn("gestao360-webhook: GESTAO360_WEBHOOK_SECRET não configurado — aceitando sem autenticação (configure em produção!)");
  }

  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey    = Deno.env.get("RESEND_API_KEY") ?? "";
  const admin        = createClient(supabaseUrl, serviceKey);

  let body: { evento?: string; consultor?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const { evento, consultor } = body;
  if (!evento || !consultor?.email) {
    return json({ error: "Campos obrigatórios: evento, consultor.email" }, 400);
  }

  const email    = consultor.email.trim().toLowerCase();
  const nome     = (consultor.nome ?? "").trim();
  const cpf      = (consultor.cpf ?? "").trim() || null;
  const unidade  = (consultor.unidade ?? "").trim() || null;
  const atividade = consultor.atividade ?? "";

  // ----------------------------------------------------------------
  // EVENTO: consultor_iniciado
  // ----------------------------------------------------------------
  if (evento === "consultor_iniciado") {
    // Cadastro no Mapa de Vendas é SEMPRE manual (a própria consultora se cadastra).
    // O webhook NÃO cria conta — apenas atualiza o perfil se a consultora
    // já tiver se cadastrado por conta própria no app.
    const { data: existingList } = await admin.auth.admin.listUsers();
    const existing = (existingList?.users ?? []).find(u => u.email === email);

    if (!existing) {
      console.log(`gestao360-webhook: consultor_iniciado ignorado — ${email} ainda não tem conta no app (cadastro é manual)`);
      return json({ ok: true, action: "aguardando_cadastro_manual" });
    }

    // Já tem conta — apenas aprova e atualiza perfil
    await admin.from("profiles").update({
      approved: true,
      display_name: nome || undefined,
      unit: unidade || undefined,
      cpf: cpf || undefined,
    }).eq("user_id", existing.id);

    // Garante email confirmado
    await admin.auth.admin.updateUserById(existing.id, { email_confirm: true });

    console.log(`gestao360-webhook: perfil existente aprovado para ${email}`);
    return json({ ok: true, action: "aprovado_existente" });
  }

  // ----------------------------------------------------------------
  // EVENTO: consultor_desligado
  // ----------------------------------------------------------------
  if (evento === "consultor_desligado") {
    // Busca pelo email no profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.user_id) {
      console.warn(`gestao360-webhook: desligamento — usuário não encontrado: ${email}`);
      return json({ ok: true, action: "nao_encontrado", message: "Usuário não existe no app" });
    }

    await admin.from("profiles").update({ approved: false }).eq("user_id", profile.user_id);

    console.log(`gestao360-webhook: acesso bloqueado para ${email}`);
    return json({ ok: true, action: "acesso_bloqueado" });
  }

  // ----------------------------------------------------------------
  // EVENTO: consultor_reativado
  // ----------------------------------------------------------------
  if (evento === "consultor_reativado") {
    const { data: profile } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.user_id) {
      return json({ ok: true, action: "nao_encontrado", message: "Usuário não existe no app" });
    }

    await admin.from("profiles").update({ approved: true }).eq("user_id", profile.user_id);
    await admin.auth.admin.updateUserById(profile.user_id, { email_confirm: true });

    console.log(`gestao360-webhook: acesso reativado para ${email}`);
    return json({ ok: true, action: "acesso_reativado" });
  }

  return json({ error: `Evento desconhecido: ${evento}` }, 400);
});
