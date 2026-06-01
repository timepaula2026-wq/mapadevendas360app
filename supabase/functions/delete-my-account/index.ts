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
    const uid = userData.user.id;

    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", uid)
      .maybeSingle();
    const deletedEmail = userData.user.email || targetProfile?.email || null;
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
        // Algumas tabelas usam created_by em vez de user_id
        if (["appointments", "blocked_slots", "schedule_configs"].includes(t)) {
          await admin.from(t).delete().eq("created_by", uid);
        } else if (t === "quiz_sessions") {
          await admin.from(t).delete().eq("host_id", uid);
        } else {
          await admin.from(t).delete().eq("user_id", uid);
        }
      } catch (err) {
        console.warn(`Falha ao limpar ${t}:`, err);
      }
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (deletedEmail) {
      await admin.from("deleted_accounts").insert({
        email: deletedEmail,
        display_name: deletedName,
        deleted_by: uid,
        reason: "self_delete",
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});