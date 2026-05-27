import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  ticket_id: string;
  sender_user_id: string | null;
  sender_kind: string;
  message: string | null;
  photo_url: string | null;
  created_at: string;
}

interface Props {
  ticketId: string;
  asAdmin?: boolean;
}

const SupportTicketChat = ({ ticketId, asAdmin = false }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data || []) as Message[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`ticket-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para responder");
      return;
    }
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (upErr) throw upErr;
        photo_url = supabase.storage.from("support-attachments").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        sender_user_id: user.id,
        sender_kind: asAdmin ? "admin" : "user",
        message: text.trim() || null,
        photo_url,
      });
      if (error) throw error;
      setText("");
      setFile(null);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + (e.message || ""));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted/30 rounded-lg p-2 max-h-80 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</p>
        ) : (
          messages.map((m) => {
            const mine =
              (asAdmin && m.sender_kind === "admin") ||
              (!asAdmin && m.sender_kind === "user");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <div className="text-[10px] opacity-70 mb-0.5">
                    {m.sender_kind === "admin" ? "Suporte" : "Você"} ·{" "}
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </div>
                  {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
                  {m.photo_url && (
                    <a
                      href={m.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-1"
                    >
                      <img
                        src={m.photo_url}
                        alt="anexo"
                        className="rounded-md max-h-40 object-cover"
                      />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-1 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma resposta..."
          rows={2}
          maxLength={2000}
          className="flex-1 bg-secondary border border-input rounded-md px-2 py-1.5 text-xs resize-none"
        />
        <div className="flex flex-col gap-1">
          <label className="cursor-pointer p-2 rounded-md bg-secondary border border-input text-muted-foreground hover:text-foreground">
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <Button size="sm" onClick={send} disabled={sending} className="px-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      {file && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="truncate">{file.name}</span>
          <button onClick={() => setFile(null)} className="text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SupportTicketChat;