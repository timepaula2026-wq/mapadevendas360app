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

    const { target_user_id } = await req.json();
    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limpa dados relacionados
    // Captura e-mail/nome antes de excluir para registrar histórico
    const { data: targetUser } = await admin.auth.admin.getUserById(target_user_id);
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", target_user_id)
      .maybeSingle();
    const deletedEmail = targetUser?.user?.email || targetProfile?.email || null;
    const deletedName = targetProfile?.display_name || null;

    // Limpa todos os dados do usuário em tabelas relacionadas
    const userTables = [
      "cart_items",
      "order_items",
      "orders",
      "rentals",
      "appointments",
      "blocked_slots",
      "schedule_configs",
      "planejamento_entries",
      "planejamento_form_drafts",
      "trilha_progress",
      "trilha_certificates",
      "user_content_uploads",
      "user_notifications",
      "notification_reads",
      "content_items",
      "trainings",
      "quiz_responses",
      "quiz_participants",
      "quiz_questions",
      "quiz_sessions",
      "quizzes",
      "section_contents",
      "support_ticket_messages",
      "support_tickets",
      "feedback_messages",
      "user_roles",
      "profiles",
    ];
    for (const t of userTables) {
      try {
        if (["appointments", "blocked_slots", "schedule_configs"].includes(t)) {
          await admin.from(t).delete().eq("created_by", target_user_id);
        } else if (t === "quiz_sessions") {
          await admin.from(t).delete().eq("host_id", target_user_id);
        } else {
          await admin.from(t).delete().eq("user_id", target_user_id);
        }
      } catch (err) {
        console.warn(`Falha ao limpar ${t}:`, err);
      }
    }

    // Apaga usuário do auth
    const { error: delErr } = await admin.auth.admin.deleteUser(target_user_id);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Registra histórico de exclusão (para mostrar aviso ao tentar novo cadastro)
    if (deletedEmail) {
      await admin.from("deleted_accounts").insert({
        email: deletedEmail,
        display_name: deletedName,
        deleted_by: userData.user.id,
        reason: "admin_delete",
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});