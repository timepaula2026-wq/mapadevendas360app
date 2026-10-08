import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Extrai o user_id do JWT sem verificar assinatura (gateway já verificou). */
function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin       = createClient(supabaseUrl, serviceKey);

    // Identifica quem está chamando pelo JWT (já verificado pelo gateway)
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerId = getUserIdFromJwt(authHeader);

    if (!callerId) {
      return json({ error: "Não autenticado" }, 401);
    }

    // Verifica se o caller é admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "Apenas administradores podem resetar senhas" }, 403);
    }

    // Lê o body
    let body: { target_user_id?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "JSON inválido" }, 400);
    }

    const { target_user_id, password } = body;
    if (!target_user_id) {
      return json({ error: "target_user_id obrigatório" }, 400);
    }

    const newPassword: string =
      password && String(password).length >= 6 ? String(password) : "123456";

    // Redefine a senha no Supabase Auth
    const { error: updErr } = await admin.auth.admin.updateUserById(target_user_id, {
      password: newPassword,
      email_confirm: true,
    });

    if (updErr) {
      const notFound =
        updErr.message?.toLowerCase().includes("not found") ||
        updErr.message?.toLowerCase().includes("user not found") ||
        (updErr as any)?.code === "user_not_found";

      if (!notFound) {
        console.error("admin-reset-password: erro ao atualizar senha", updErr.message);
        return json({ error: `Falha ao redefinir: ${updErr.message}` }, 500);
      }

      // Usuário sem conta ativa no auth
      return json({
        ok: true,
        warning: "Usuário sem conta de acesso ativo; senha não alterada.",
      });
    }

    // Marca para troca obrigatória de senha no próximo login
    const { error: profErr } = await admin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", target_user_id);

    if (profErr) {
      // Não crítico — senha foi redefinida, só o flag falhou
      console.warn("admin-reset-password: falha ao marcar must_change_password", profErr.message);
    }

    console.log(`admin-reset-password: senha redefinida para ${target_user_id} por ${callerId}`);
    return json({ ok: true, password: newPassword });

  } catch (e) {
    console.error("admin-reset-password: erro inesperado", (e as any)?.message ?? e);
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
