import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALIDAR_CPF_URL = "https://gvulpruievqfjdgowrdb.supabase.co/functions/v1/validar-cpf";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf || typeof cpf !== 'string') {
      return new Response(
        JSON.stringify({ allowed: false, message: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return new Response(
        JSON.stringify({ allowed: false, message: "CPF inválido. Deve conter 11 dígitos." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating CPF: ${cleanCpf.substring(0, 3)}***`);

    const response = await fetch(VALIDAR_CPF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: cleanCpf }),
    });

    const responseText = await response.text();
    console.log("validar-cpf status:", response.status, "body:", responseText.substring(0, 300));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ allowed: true, status: "api_unavailable", message: "Serviço de validação indisponível. Acesso liberado temporariamente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data: { valido?: boolean; ativo?: boolean | null; nome?: string | null };
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ allowed: true, status: "parse_error", message: "Erro ao processar resposta. Acesso liberado temporariamente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.valido) {
      return new Response(
        JSON.stringify({ allowed: false, status: "not_found", message: "CPF não encontrado no Mapadevendas360. Procure o suporte." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (data.ativo === false) {
      return new Response(
        JSON.stringify({ allowed: false, status: "inactive", message: "Consultor inativo. Acesso não permitido." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true, status: "ativo", nome: data.nome ?? null, message: "Consultor ativo." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error validating CPF:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ allowed: false, message: `Erro ao validar CPF: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
