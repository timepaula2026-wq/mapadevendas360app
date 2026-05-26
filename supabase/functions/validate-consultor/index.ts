import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALIDAR_NOME_URL = "https://mapadevendas360.com.br/candidatos/validar-nome";

type ValidationResponse = {
  allowed: boolean;
  status: "ok" | "invalid_format" | "not_found" | "inactive" | "api_unavailable" | "parse_error" | "missing_nome" | "error";
  message: string;
  nome?: string | null;
};

function jsonResponse(body: ValidationResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: { nome?: unknown };
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({
        allowed: false,
        status: "missing_nome",
        message: "Requisição inválida. Envie um JSON contendo o campo 'nome'.",
      }, 400);
    }

    const { nome } = payload;

    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return jsonResponse({
        allowed: false,
        status: "missing_nome",
        message: "Nome completo é obrigatório.",
      }, 400);
    }

    const cleanNome = nome.trim().replace(/\s+/g, " ");
    if (cleanNome.split(" ").length < 2 || cleanNome.length < 4) {
      return jsonResponse({
        allowed: false,
        status: "invalid_format",
        message: "Informe seu nome completo (nome e sobrenome).",
      });
    }

    console.log(`Validating nome: ${cleanNome.substring(0, 3)}***`);

    let response: Response;
    try {
      response = await fetch(VALIDAR_NOME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ nome: cleanNome }),
      });
    } catch (fetchError) {
      console.error("Network error calling validar-nome:", fetchError);
      return jsonResponse({
        allowed: false,
        status: "api_unavailable",
        message: "Não foi possível validar seu nome no momento. Tente novamente em instantes.",
      });
    }

    const responseText = await response.text();
    console.log("validar-nome status:", response.status, "body:", responseText.substring(0, 300));

    if (!response.ok) {
      return jsonResponse({
        allowed: false,
        status: "api_unavailable",
        message: "Serviço de validação indisponível. Tente novamente em instantes.",
      });
    }

    let data: {
      valido?: boolean;
      status?: string | null;
      nome?: string | null;
    };
    try {
      data = JSON.parse(responseText);
    } catch {
      return jsonResponse({
        allowed: false,
        status: "parse_error",
        message: "Resposta inesperada do serviço de validação. Tente novamente.",
      });
    }

    if (data.valido !== true) {
      return jsonResponse({
        allowed: false,
        status: "not_found",
        message: "Nome não encontrado na base de consultores. Verifique a grafia ou entre em contato com o suporte.",
      });
    }

    // Aceita "Aprovado" e "Aprovado (Pend. Doc)" como liberados.
    const rawStatus = (data.status ?? "").toString().trim();
    const normalizedStatus = normalizeName(rawStatus);
    const isAprovado = normalizedStatus === "aprovado";
    const isAprovadoPendDoc =
      normalizedStatus.startsWith("aprovado") && normalizedStatus.includes("pend");

    if (rawStatus && !isAprovado && !isAprovadoPendDoc) {
      return jsonResponse({
        allowed: false,
        status: "inactive",
        message: `Cadastro com status "${rawStatus}". Acesso não liberado. Procure o suporte para regularizar.`,
      });
    }

    return jsonResponse({
      allowed: true,
      status: "ok",
      nome: data.nome ?? null,
      message: rawStatus
        ? `Cadastro ${rawStatus}. Acesso liberado.`
        : "Cadastro aprovado. Acesso liberado.",
    });
  } catch (error: unknown) {
    console.error("Unexpected error validating nome:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({
      allowed: false,
      status: "error",
      message: `Erro ao validar nome: ${errorMessage}`,
    }, 500);
  }
};

serve(handler);
