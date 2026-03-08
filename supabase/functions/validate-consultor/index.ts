import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GESTAO360_API_BASE = "https://mapadevendas360.com.br/api/consultores";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${GESTAO360_API_BASE}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
    console.log(`Validating consultor status for: ${email}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      // API returned error or consultant not found
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ allowed: false, status: "not_found", message: "Consultor não encontrado no sistema Gestão360." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gestão360 API error [${response.status}]: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("Gestão360 response:", JSON.stringify(data));

    // Extract status - try common response formats
    const status = (
      data?.status || 
      data?.data?.status || 
      data?.consultor?.status || 
      ""
    ).toString().toLowerCase().trim();

    const allowedStatuses = ["ativo", "aprovado"];
    const blockedStatuses = ["inativo", "desligado"];

    if (allowedStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ allowed: true, status, message: "Consultor ativo." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reason = blockedStatuses.includes(status)
      ? `Consultor com status "${status}". Acesso não permitido.`
      : `Status "${status || 'desconhecido'}" não autorizado para acesso.`;

    return new Response(
      JSON.stringify({ allowed: false, status: status || "unknown", message: reason }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error validating consultor:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: `Erro ao validar consultor: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
