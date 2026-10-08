/**
 * gestao360-webhook
 *
 * Recebe eventos do Sistema Gestão 360 e sincroniza o acesso no Mapa de Vendas.
 *
 * Eventos suportados:
 *   "consultor_iniciado"  → aprova perfil existente (cadastro é SEMPRE manual no app)
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

/** Busca o user_id a partir do e-mail usando a API admin do Supabase Auth. */
async function findUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  emailToFind: string,
): Promise<string | null> {
  const { data: list } = await admin.auth.admin.listUsers();
  const found = (list?.users ?? []).find((u) => u.email === emailToFind);
  return found?.id ?? null;
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
    console.warn(
      "gestao360-webhook: GESTAO360_WEBHOOK_SECRET não configurado — aceitando sem autenticação (configure em produção!)",
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin       = createClient(supabaseUrl, serviceKey);

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

  // ----------------------------------------------------------------
  // EVENTO: consultor_iniciado
  // ----------------------------------------------------------------
  if (evento === "consultor_iniciado") {
    // Cadastro no Mapa de Vendas é SEMPRE manual (a própria consultora se cadastra).
    // O webhook NÃO cria conta — apenas atualiza o perfil se a consultora
    // já tiver se cadastrado por conta própria no app.
    const userId = await findUserIdByEmail(admin, email);

    if (!userId) {
      console.log(
        `gestao360-webhook: consultor_iniciado ignorado — ${email} ainda não tem conta no app (cadastro é manual)`,
      );
      return json({ ok: true, action: "aguardando_cadastro_manual" });
    }

    // Já tem conta — apenas aprova e atualiza perfil
    await admin.from("profiles").update({
      approved: true,
      display_name: nome || undefined,
      unit: unidade || undefined,
      cpf: cpf || undefined,
    }).eq("user_id", userId);

    // Garante email confirmado
    await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    console.log(`gestao360-webhook: perfil existente aprovado para ${email}`);
    return json({ ok: true, action: "aprovado_existente" });
  }

  // ----------------------------------------------------------------
  // EVENTO: consultor_desligado
  // ----------------------------------------------------------------
  if (evento === "consultor_desligado") {
    const userId = await findUserIdByEmail(admin, email);

    if (!userId) {
      console.warn(`gestao360-webhook: desligamento — usuário não encontrado: ${email}`);
      return json({ ok: true, action: "nao_encontrado", message: "Usuário não existe no app" });
    }

    await admin.from("profiles").update({ approved: false }).eq("user_id", userId);

    console.log(`gestao360-webhook: acesso bloqueado para ${email}`);
    return json({ ok: true, action: "acesso_bloqueado" });
  }

  // ----------------------------------------------------------------
  // EVENTO: consultor_reativado
  // ----------------------------------------------------------------
  if (evento === "consultor_reativado") {
    const userId = await findUserIdByEmail(admin, email);

    if (!userId) {
      return json({ ok: true, action: "nao_encontrado", message: "Usuário não existe no app" });
    }

    await admin.from("profiles").update({ approved: true }).eq("user_id", userId);
    await admin.auth.admin.updateUserById(userId, { email_confirm: true });

    console.log(`gestao360-webhook: acesso reativado para ${email}`);
    return json({ ok: true, action: "acesso_reativado" });
  }

  return json({ error: `Evento desconhecido: ${evento}` }, 400);
});
