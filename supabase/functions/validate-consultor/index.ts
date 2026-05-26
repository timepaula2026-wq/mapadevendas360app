import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VALIDAR_CPF_URL = "https://gvulpruievqfjdgowrdb.supabase.co/functions/v1/validar-cpf";

type ValidationResponse = {
  allowed: boolean;
  status: "ok" | "invalid_format" | "not_found" | "inactive" | "api_unavailable" | "parse_error" | "missing_cpf" | "error";
  message: string;
  nome?: string | null;
};

function jsonResponse(body: ValidationResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  if (check2 !== parseInt(cpf[10])) return false;

  return true;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let payload: { cpf?: unknown };
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({
        allowed: false,
        status: "missing_cpf",
        message: "Requisição inválida. Envie um JSON contendo o campo 'cpf'.",
      }, 400);
    }

    const { cpf } = payload;

    if (!cpf || typeof cpf !== "string" || cpf.trim() === "") {
      return jsonResponse({
        allowed: false,
        status: "missing_cpf",
        message: "CPF é obrigatório.",
      }, 400);
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      return jsonResponse({
        allowed: false,
        status: "invalid_format",
        message: "CPF inválido. Informe os 11 dígitos corretamente.",
      });
    }

    if (!isValidCPF(cleanCpf)) {
      return jsonResponse({
        allowed: false,
        status: "invalid_format",
        message: "CPF inválido. Verifique os dígitos informados.",
      });
    }

    console.log(`Validating CPF: ${cleanCpf.substring(0, 3)}***`);

    let response: Response;
    try {
      response = await fetch(VALIDAR_CPF_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cleanCpf }),
      });
    } catch (fetchError) {
      console.error("Network error calling validar-cpf:", fetchError);
      return jsonResponse({
        allowed: false,
        status: "api_unavailable",
        message: "Não foi possível validar o CPF no momento. Tente novamente em instantes.",
      });
    }

    const responseText = await response.text();
    console.log("validar-cpf status:", response.status, "body:", responseText.substring(0, 300));

    if (!response.ok) {
      return jsonResponse({
        allowed: false,
        status: "api_unavailable",
        message: "Serviço de validação indisponível. Tente novamente em instantes.",
      });
    }

    let data: {
      valido?: boolean;
      ativo?: boolean | null;
      nome?: string | null;
      status?: string | null;
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

    // Normaliza status textual da API (ex.: "Aprovado", "Aprovado (Pend. Doc)", "Não Aprovado Doc")
    const rawStatus = (data.status ?? "").toString().trim();
    const normalizedStatus = rawStatus
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Se a API já envia o campo status, usamos ele como fonte de verdade.
    if (rawStatus) {
      const isAprovado = normalizedStatus === "aprovado";
      const isAprovadoPendDoc =
        normalizedStatus.startsWith("aprovado") &&
        normalizedStatus.includes("pend");

      if (!isAprovado && !isAprovadoPendDoc) {
        return jsonResponse({
          allowed: false,
          status: "inactive",
          message: `Cadastro com status "${rawStatus}". Acesso não liberado. Procure o suporte para regularizar.`,
        });
      }
    } else {
      // Fallback: API antiga (sem campo status) — usa valido/ativo.
      if (data.valido !== true) {
        return jsonResponse({
          allowed: false,
          status: "not_found",
          message: "CPF não encontrado na base de consultores. Entre em contato com o suporte.",
        });
      }

      if (data.ativo === false) {
        return jsonResponse({
          allowed: false,
          status: "inactive",
          message: "Consultor inativo. Acesso não permitido. Procure o suporte para regularizar.",
        });
      }
    }

    return jsonResponse({
      allowed: true,
      status: "ok",
      nome: data.nome ?? null,
      message: rawStatus
        ? `Cadastro ${rawStatus}. Acesso liberado.`
        : "Consultor ativo. Acesso liberado.",
    });
  } catch (error: unknown) {
    console.error("Unexpected error validating CPF:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({
      allowed: false,
      status: "error",
      message: `Erro ao validar CPF: ${errorMessage}`,
    }, 500);
  }
};

serve(handler);
