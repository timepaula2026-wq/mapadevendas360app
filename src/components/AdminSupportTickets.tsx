import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  name: string;
  email: string;
  unit: string | null;
  message: string;
  photo_url: string | null;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
};

const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar tickets");
    else setTickets((data as Ticket[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const notes = notesDraft[id];
    const { error } = await supabase
      .from("support_tickets")
      .update({ status, ...(notes !== undefined ? { resolution_notes: notes } : {}) })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Atualizado!"); fetchTickets(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este ticket?")) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetchTickets(); }
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_LABEL[s]} ({s === "all" ? tickets.length : tickets.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum ticket.</p>
      )}

      {filtered.map((t) => (
        <div key={t.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm text-foreground">{t.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  t.status === "resolved" ? "bg-emerald-500/20 text-emerald-500" :
                  t.status === "in_progress" ? "bg-amber-500/20 text-amber-500" :
                  "bg-primary/20 text-primary"
                }`}>{STATUS_LABEL[t.status] || t.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.email} {t.unit && `· ${t.unit}`} · {new Date(t.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-foreground whitespace-pre-wrap">{t.message}</p>

          {t.photo_url && (
            <a
              href={t.photo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Ver anexo
            </a>
          )}

          <textarea
            defaultValue={t.resolution_notes || ""}
            onChange={(e) => setNotesDraft((p) => ({ ...p, [t.id]: e.target.value }))}
            placeholder="Notas de resolução..."
            rows={2}
            className="w-full bg-secondary border border-input rounded-md px-2 py-1.5 text-xs resize-none"
          />

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "in_progress")}>
              Em andamento
            </Button>
            <Button size="sm" onClick={() => updateStatus(t.id, "resolved")} className="gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
            </Button>
            {t.status !== "open" && (
              <Button size="sm" variant="ghost" onClick={() => updateStatus(t.id, "open")}>
                Reabrir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminSupportTickets;