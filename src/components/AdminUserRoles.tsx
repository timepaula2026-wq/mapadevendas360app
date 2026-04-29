import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROLES } from "@/lib/roles";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  unit: string | null;
}

const AdminUserRoles = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, unit").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((profs as ProfileRow[]) || []);
    const map: Record<string, string[]> = {};
    (roles as { user_id: string; role: string }[] || []).forEach((r) => {
      map[r.user_id] = [...(map[r.user_id] || []), r.role];
    });
    setRolesByUser(map);
    setLoading(false);
  };

  const toggleRole = async (userId: string, role: string) => {
    setSavingId(userId);
    const current = rolesByUser[userId] || [];
    const has = current.includes(role);
    if (has) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as never);
      if (error) toast.error("Erro ao remover papel");
      else {
        setRolesByUser((p) => ({ ...p, [userId]: current.filter((r) => r !== role) }));
        toast.success("Papel removido");
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as never });
      if (error) toast.error("Erro ao atribuir papel");
      else {
        setRolesByUser((p) => ({ ...p, [userId]: [...current, role] }));
        toast.success("Papel atribuído");
      }
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Defina os papéis de cada usuário. O papel controla quais ícones da tela inicial ficam liberados.
      </p>
      {profiles.map((p) => {
        const userRoles = rolesByUser[p.user_id] || [];
        return (
          <div key={p.user_id} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-foreground truncate flex-1">
                {p.display_name || "Sem nome"}
              </p>
              {savingId === p.user_id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            {p.unit && <p className="text-[10px] text-muted-foreground mb-2">📍 {p.unit}</p>}
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => {
                const active = userRoles.includes(r.value);
                return (
                  <button
                    key={r.value}
                    onClick={() => toggleRole(p.user_id, r.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {profiles.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum usuário cadastrado</p>
      )}
    </div>
  );
};

export default AdminUserRoles;