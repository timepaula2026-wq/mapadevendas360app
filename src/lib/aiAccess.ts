import { toast } from "sonner";

/**
 * Liga/desliga todos os recursos que dependem de chave de IA
 * (IA do Consórcio, simulados, criativos, vídeo do cenário, busca com IA, quiz com IA).
 * Enquanto a assinatura não estiver ativa, fica `false` e o app mostra o aviso abaixo.
 */
export const AI_ENABLED = false;

export const AI_LOCKED_MESSAGE = "Você precisa assinar para usar esse recurso.";

/** Retorna true se pode usar a IA; senão mostra o aviso e retorna false. */
export function requireAi(): boolean {
  if (AI_ENABLED) return true;
  toast.info("🔒 Recurso exclusivo para assinantes", {
    id: "ai-locked",
    description: AI_LOCKED_MESSAGE,
  });
  return false;
}
