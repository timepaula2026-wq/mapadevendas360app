import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find users inactive for 15+ days
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const { data: inactiveUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, display_name, last_active_at")
      .lt("last_active_at", fifteenDaysAgo.toISOString())
      .eq("approved", true);

    if (fetchError) throw fetchError;

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No inactive users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a notification for inactive users
    // First check if we already sent one today
    const today = new Date().toISOString().split("T")[0];
    const notificationTitle = `Sentimos sua falta!`;
    const notificationMessage = `Faz mais de 15 dias que você não acessa o app. Volte para conferir as novidades!`;

    // Use a system user id for the notification
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ message: "No admin found to create notification" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        title: notificationTitle,
        message: notificationMessage,
        created_by: adminRole.user_id,
      });

    if (notifError) throw notifError;

    return new Response(
      JSON.stringify({
        message: `Notification created for ${inactiveUsers.length} inactive users`,
        inactive_users: inactiveUsers.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
