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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verifica que o chamador é admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Apenas administradores" }, 403);

    const { target_user_id } = await req.json();
    if (!target_user_id) return json({ error: "target_user_id obrigatório" }, 400);

    // 1. Remove user_roles
    await admin.from("user_roles").delete().eq("user_id", target_user_id);

    // 2. Remove profile
    await admin.from("profiles").delete().eq("user_id", target_user_id);

    // 3. Remove da auth.users (pode não existir para usuários migrados — ignora erro)
    const { error: authErr } = await admin.auth.admin.deleteUser(target_user_id);
    if (authErr) {
      const notFound =
        authErr.message?.toLowerCase().includes("not found") ||
        authErr.message?.toLowerCase().includes("user not found") ||
        (authErr as any)?.status === 404 ||
        (authErr as any)?.code === "user_not_found";
      if (!notFound) {
        return json({ error: `Erro ao remover acesso: ${authErr.message}` }, 500);
      }
      // Usuário migrado sem conta real — profile já foi removido, tudo ok
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
