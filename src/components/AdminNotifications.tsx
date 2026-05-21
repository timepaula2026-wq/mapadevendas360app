import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader2, Trash2, Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar notificações");
    else setNotifications(data || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("notifications").insert({
      title: title.trim(),
      message: message.trim(),
      created_by: user.id,
    });
    if (error) toast.error("Erro ao enviar notificação");
    else {
      toast.success("Notificação enviada para todos os usuários!");
      setTitle("");
      setMessage("");
      fetchNotifications();
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Notificação excluída!");
      fetchNotifications();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Nova Notificação</h3>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da notificação"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Mensagem para todos os usuários..."
          rows={3}
          className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none border border-input"
        />
        <Button
          onClick={handleSend}
          disabled={!title.trim() || !message.trim() || sending}
          className="w-full gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Enviando..." : "Enviar para todos"}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Notificações enviadas</p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma notificação enviada</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => handleDelete(n.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
