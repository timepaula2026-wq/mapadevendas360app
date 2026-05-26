import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Row = {
  email: string;
  display_name: string;
  phone?: string;
  unit?: string;
  activity?: string;
  matricula_cpf?: string;
};

const activityToRole = (a?: string): "iniciante" | "autorizado" | "gestor" | "secretaria" => {
  const v = (a || "").toUpperCase().trim();
  if (v.includes("INICIANTE")) return "iniciante";
  if (v.includes("AUTORIZADO")) return "autorizado";
  if (v.includes("GESTOR")) return "gestor";
  if (v.includes("ADMINISTRATIVO")) return "secretaria";
  return "iniciante";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller is admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas administradores" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const rows: Row[] = body.rows || [];
    const defaultPassword: string = body.password || "1234456";

    const results: Array<{ email: string; status: string; message?: string }> = [];

    for (const r of rows) {
      const email = (r.email || "").trim().toLowerCase();
      if (!email || !email.includes("@")) {
        results.push({ email: r.email, status: "skip", message: "e-mail inválido" });
        continue;
      }
      const role = activityToRole(r.activity);

      // Create or fetch user
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: r.display_name,
          phone: r.phone,
          unit: r.unit,
          cpf: r.matricula_cpf,
        },
      });

      let userId = created?.user?.id;
      if (createErr || !userId) {
        // try lookup existing
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
        if (!found) {
          results.push({ email, status: "error", message: createErr?.message || "falha ao criar" });
          continue;
        }
        userId = found.id;
        // reset password to default
        await admin.auth.admin.updateUserById(userId, { password: defaultPassword, email_confirm: true });
      }

      // Upsert profile
      await admin.from("profiles").upsert({
        user_id: userId,
        display_name: r.display_name,
        phone: r.phone,
        unit: r.unit,
        cpf: r.matricula_cpf,
        approved: true,
        must_change_password: true,
        last_active_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      // Insert role
      await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      results.push({ email, status: created ? "created" : "updated" });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});