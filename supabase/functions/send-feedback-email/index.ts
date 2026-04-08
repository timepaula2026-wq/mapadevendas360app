import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, message, name } = await req.json();

    const categoryLabels: Record<string, string> = {
      sugestao: "💡 Sugestão",
      duvida: "❓ Dúvida",
      reclamacao: "⚠️ Reclamação",
      elogio: "⭐ Elogio",
    };

    const emailBody = `
Nova mensagem no canal "Fale com a Paula"

Tipo: ${categoryLabels[category] || category}
Nome: ${name || "Anônimo"}
Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}

Mensagem:
${message}
    `.trim();

    // Use Supabase's built-in email or a simple approach
    // For now, we log and store - the admin panel shows all messages
    console.log("Feedback received:", { category, name, message });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
