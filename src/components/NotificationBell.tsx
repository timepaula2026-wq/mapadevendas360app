import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  // Presentes apenas em user_notifications
  personal?: boolean;
  kind?: string | null;
  read_at?: string | null;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const [globalRes, personalRes, readsRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", user.id),
    ]);

    const personal: Notification[] = (personalRes.data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      created_at: n.created_at,
      personal: true,
      kind: n.kind,
      read_at: n.read_at,
    }));
    const global: Notification[] = (globalRes.data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      created_at: n.created_at,
    }));

    const merged = [...personal, ...global].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Mostra um toast para novas notificações pessoais (após o primeiro load)
    if (!firstLoadRef.current) {
      personal.forEach((n) => {
        if (!knownIdsRef.current.has(n.id) && !n.read_at) {
          if (n.kind === "rejection") toast.error(n.title, { description: n.message });
          else toast.success(n.title, { description: n.message });
        }
      });
    }
    knownIdsRef.current = new Set(merged.map((n) => n.id));
    firstLoadRef.current = false;

    setNotifications(merged);

    const reads = new Set((readsRes.data || []).map((r) => r.notification_id));
    // Marca notificações pessoais já lidas (read_at preenchido)
    personal.forEach((n) => {
      if (n.read_at) reads.add(n.id);
    });
    setReadIds(reads);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    // Realtime para notificações pessoais
    if (!user) return;
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotifications(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = async (n: Notification) => {
    if (!user || readIds.has(n.id)) return;
    if (n.personal) {
      await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
    } else {
      await supabase.from("notification_reads").insert({
        notification_id: n.id,
        user_id: user.id,
      });
    }
    setReadIds((prev) => new Set(prev).add(n.id));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !readIds.has(n.id));
    if (unread.length === 0) return;
    const personalUnread = unread.filter((n) => n.personal);
    const globalUnread = unread.filter((n) => !n.personal);
    if (personalUnread.length > 0) {
      await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", personalUnread.map((n) => n.id));
    }
    if (globalUnread.length > 0) {
      await supabase.from("notification_reads").insert(
        globalUnread.map((n) => ({ notification_id: n.id, user_id: user.id })),
      );
    }
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="text-white/80 hover:text-white relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-lg">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n)}
                    className={`w-full text-left p-3 border-b border-border last:border-0 transition-colors ${
                      isRead ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {n.kind === "approval" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : n.kind === "rejection" ? (
                        <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      ) : !isRead ? (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
