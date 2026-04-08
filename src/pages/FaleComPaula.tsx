import { useState } from "react";
import { ArrowLeft, MessageCircleHeart, Send, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const categories = [
  { value: "sugestao", label: "💡 Sugestão", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { value: "duvida", label: "❓ Dúvida", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  { value: "reclamacao", label: "⚠️ Reclamação", color: "bg-red-500/10 text-red-500 border-red-500/30" },
  { value: "elogio", label: "⭐ Elogio", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
];

const FaleComPaula = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("sugestao");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Escreva sua mensagem");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("feedback_messages").insert({
      category,
      message: message.trim(),
      name: name.trim() || null,
    } as any);

    if (error) {
      toast.error("Erro ao enviar mensagem");
      setSending(false);
      return;
    }

    // Send email notification
    try {
      await supabase.functions.invoke("send-feedback-email", {
        body: {
          category,
          message: message.trim(),
          name: name.trim() || "Anônimo",
        },
      });
    } catch {
      // Email is best-effort
    }

    setSent(true);
    setSending(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Mensagem enviada!</h2>
          <p className="text-sm text-muted-foreground">
            Sua mensagem foi recebida com sucesso. Obrigado pelo seu feedback!
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setSent(false); setMessage(""); setName(""); }} className="flex-1">
              Nova mensagem
            </Button>
            <Button onClick={() => navigate("/")} className="flex-1">
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-pink-600 to-rose-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3 mb-2">
          <MessageCircleHeart className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Fale com a Paula</h1>
        </div>
        <p className="text-white/70 text-sm">
          Envie sugestões, dúvidas, reclamações ou elogios. Sua identidade é opcional.
        </p>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* Category */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo da mensagem</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  category === cat.value
                    ? cat.color + " border-current"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Sua mensagem *</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva aqui sua mensagem..."
            className="min-h-[120px] resize-none"
            maxLength={1000}
          />
          <span className="text-[10px] text-muted-foreground mt-1 block text-right">{message.length}/1000</span>
        </div>

        {/* Name (optional) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Seu nome <span className="text-muted-foreground/60">(opcional)</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Não obrigatório"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || sending}
          className="w-full gap-2"
          size="lg"
        >
          <Send className="w-4 h-4" />
          {sending ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </div>
    </div>
  );
};

export default FaleComPaula;
