import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);

    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id);
    setReadIds(new Set((reads || []).map((r) => r.notification_id)));
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = async (notificationId: string) => {
    if (!user || readIds.has(notificationId)) return;
    await supabase.from("notification_reads").insert({
      notification_id: notificationId,
      user_id: user.id,
    });
    setReadIds((prev) => new Set(prev).add(notificationId));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !readIds.has(n.id));
    if (unread.length === 0) return;
    await supabase.from("notification_reads").insert(
      unread.map((n) => ({ notification_id: n.id, user_id: user.id }))
    );
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="text-muted-foreground hover:text-foreground relative"
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
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left p-3 border-b border-border last:border-0 transition-colors ${
                      isRead ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
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
