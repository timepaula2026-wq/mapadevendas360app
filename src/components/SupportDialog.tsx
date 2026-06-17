import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UNITS } from "@/lib/units";
import { useAuth } from "@/hooks/useAuth";
import SupportTicketChat from "@/components/SupportTicketChat";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillMessage?: string;
}

interface MyTicket {
  id: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
};

const SupportDialog = ({ open, onOpenChange, prefillMessage }: SupportDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"new" | "mine">("new");
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  // Prefill from profile when logged in
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("profiles")
      .select("display_name, unit")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name);
        if (data?.unit) setUnit(data.unit);
        if (user.email) setEmail(user.email);
      });
  }, [open, user]);

  // Prefill the message body when the dialog is opened with context (e.g. signup error)
  useEffect(() => {
    if (open && prefillMessage) {
      setMessage((prev) => (prev?.trim() ? prev : prefillMessage));
      setTab("new");
    }
  }, [open, prefillMessage]);

  const fetchMyTickets = async () => {
    if (!user) return;
    setLoadingMine(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("id, message, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyTickets((data || []) as MyTicket[]);
    setLoadingMine(false);
  };

  useEffect(() => {
    if (open && tab === "mine") fetchMyTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, user]);

  const reset = () => {
    setName(""); setEmail(""); setUnit(""); setMessage(""); setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Preencha nome, e-mail e descrição do problema");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
      const ticketPayload = {
        name: name.trim(),
        email: email.trim(),
        unit: unit || null,
        message: message.trim(),
        photo_url,
        user_id: user?.id || null,
      };

      let inserted: { id: string } | null = null;
      if (user) {
        const { data, error } = await supabase
          .from("support_tickets")
          .insert(ticketPayload)
          .select("id")
          .single();
        if (error) throw error;
        inserted = data;
      } else {
        const { error } = await supabase.from("support_tickets").insert(ticketPayload);
        if (error) throw error;
      }
      toast.success("Chamado aberto! Acompanhe a resposta em 'Meus chamados'.");
      reset();
      if (user && inserted?.id) {
        setTab("mine");
        setOpenTicketId(inserted.id);
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suporte</DialogTitle>
          <DialogDescription>
            Abra um chamado e converse com o suporte em tempo real.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => { setTab("new"); setOpenTicketId(null); }}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                tab === "new" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Novo chamado
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${
                tab === "mine" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Meus chamados
            </button>
          </div>
        )}

        {tab === "mine" && user ? (
          openTicketId ? (
            <div className="space-y-2">
              <button
                onClick={() => setOpenTicketId(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-3 h-3" /> Voltar
              </button>
              <SupportTicketChat ticketId={openTicketId} />
            </div>
          ) : loadingMine ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : myTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Você ainda não abriu nenhum chamado.
            </p>
          ) : (
            <div className="space-y-2">
              {myTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpenTicketId(t.id)}
                  className="w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground">
                      {STATUS_LABEL[t.status] || t.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{t.message}</p>
                </button>
              ))}
            </div>
          )
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nome completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
          <Input
            type="email"
            placeholder="E-mail *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm"
          >
            <option value="">Selecione sua unidade</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <textarea
            placeholder="Descreva o problema *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm resize-none"
          />
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <Upload className="w-4 h-4" />
              {file ? file.name : "Anexar foto (opcional)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remover anexo
              </button>
            )}
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enviar mensagem
          </Button>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;