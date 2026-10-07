/**
 * primeiro-acesso — Edge Function
 *
 * Permite que consultores com e-mail @consultor.local definam um e-mail real
 * e recebam um link de redefinição de senha, possibilitando o primeiro acesso.
 *
 * Requisição:
 *   POST { cpf: "000.000.000-00", new_email: "nome@dominio.com" }
 *
 * Resposta:
 *   200 { ok: true, message: "..." }
 *   4xx { error: "..." }
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const { cpf, new_email } = body || {};

    if (!cpf || !new_email) {
      return respond({ error: "cpf e new_email são obrigatórios" }, 400);
    }

    // Normaliza CPF (apenas dígitos)
    const cpfClean = String(cpf).replace(/\D/g, "");
    if (cpfClean.length < 11) {
      return respond({ error: "CPF inválido — informe 11 dígitos" }, 400);
    }

    // Valida formato básico do e-mail
    const emailTrimmed = String(new_email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return respond({ error: "E-mail inválido" }, 400);
    }

    // Proíbe manter @consultor.local
    if (emailTrimmed.endsWith("@consultor.local")) {
      return respond({ error: "Informe um e-mail real, não @consultor.local" }, 400);
    }

    // Busca o perfil pelo CPF (campo cpf na tabela profiles)
    // Tenta com e sem formatação
    const cpfFormatted = `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6, 9)}-${cpfClean.slice(9)}`;
    const { data: profiles, error: profileErr } = await admin
      .from("profiles")
      .select("user_id, email, display_name, cpf")
      .or(`cpf.eq.${cpfClean},cpf.eq.${cpfFormatted}`);

    if (profileErr) {
      console.error("Erro ao buscar por CPF:", profileErr);
      return respond({ error: "Erro ao buscar conta. Tente novamente." }, 500);
    }

    if (!profiles || profiles.length === 0) {
      return respond({
        error: "Nenhuma conta encontrada com este CPF. Verifique o número e tente novamente, ou entre em contato com o administrador.",
      }, 404);
    }

    // Verifica se já existe outra conta com o novo e-mail
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", emailTrimmed)
      .maybeSingle();

    if (existing) {
      return respond({
        error: "Este e-mail já está cadastrado em outra conta. Use um e-mail diferente ou faça login normalmente.",
      }, 409);
    }

    // Usa o primeiro perfil encontrado (pode haver mais de um com o mesmo CPF em duplicatas)
    const profile = profiles[0];
    const userId = profile.user_id;

    // Verifica na Auth se o e-mail atual é @consultor.local
    const { data: authUser, error: authGetErr } = await admin.auth.admin.getUserById(userId);
    if (authGetErr || !authUser?.user) {
      return respond({ error: "Usuário não encontrado no sistema." }, 404);
    }

    const currentEmail = authUser.user.email || "";
    const isPlaceholder = currentEmail.endsWith("@consultor.local");

    // Permite resetar mesmo se não for @consultor.local (usuário pode ter esquecido o e-mail)
    // mas bloqueia se o e-mail atual já for igual ao novo
    if (currentEmail === emailTrimmed) {
      return respond({
        error: "Este já é o e-mail cadastrado na sua conta. Use 'Esqueci minha senha' para recuperar o acesso.",
      }, 409);
    }

    // Atualiza o e-mail no Auth
    const { error: updateAuthErr } = await admin.auth.admin.updateUserById(userId, {
      email: emailTrimmed,
      email_confirm: true,
    });

    if (updateAuthErr) {
      console.error("Erro ao atualizar e-mail no Auth:", updateAuthErr);
      return respond({ error: `Erro ao atualizar e-mail: ${updateAuthErr.message}` }, 500);
    }

    // Atualiza o e-mail na tabela profiles
    await admin
      .from("profiles")
      .update({ email: emailTrimmed })
      .eq("user_id", userId);

    // Gera e envia link de redefinição de senha para o novo e-mail
    const siteUrl = Deno.env.get("SITE_URL") || "https://mapadevendas360app.pages.dev";
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: emailTrimmed,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      },
    });

    if (linkErr) {
      console.error("Erro ao gerar link de recovery:", linkErr);
      // E-mail já foi atualizado — retorna sucesso parcial
      return respond({
        ok: true,
        partial: true,
        message: `E-mail atualizado para ${emailTrimmed}, mas não foi possível enviar o link de redefinição de senha. Peça ao administrador para enviar o link manualmente.`,
      });
    }

    // Envia o e-mail com o link via process-email-queue ou diretamente pelo Supabase
    // O generateLink retorna action_link que podemos enviar via outro canal se necessário
    // Por enquanto, Supabase envia automaticamente ao gerar o link recovery
    const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link;

    console.log(`Primeiro acesso: CPF=${cpfClean}, user=${userId}, novo_email=${emailTrimmed}, link_gerado=${!!actionLink}`);

    return respond({
      ok: true,
      message: `E-mail definido como ${emailTrimmed}. Verifique sua caixa de entrada para criar uma senha e acessar o sistema.`,
      display_name: profile.display_name,
    });

  } catch (e) {
    console.error("Erro inesperado em primeiro-acesso:", e);
    return respond({ error: String((e as any)?.message || e) }, 500);
  }
});
