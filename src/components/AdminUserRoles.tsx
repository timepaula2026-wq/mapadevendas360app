import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoleCatalog } from "@/hooks/useRoleCatalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const { roles: ROLES, reload: reloadRoles } = useRoleCatalog();
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [creating, setCreating] = useState(false);

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

  const handleCreateRole = async () => {
    const label = newLabel.trim();
    const value = (newValue.trim() || label)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!label || !value) {
      toast.error("Informe um nome para o papel");
      return;
    }
    setCreating(true);
    const { error } = await supabase.rpc("add_app_role" as any, {
      p_value: value,
      p_label: label,
    });
    setCreating(false);
    if (error) {
      toast.error("Erro ao criar papel: " + error.message);
      return;
    }
    toast.success("Papel criado");
    setCreateOpen(false);
    setNewLabel("");
    setNewValue("");
    await reloadRoles();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Defina os papéis de cada usuário. O papel controla quais ícones da tela inicial ficam liberados.
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="w-3.5 h-3.5 mr-1" /> Novo papel
        </Button>
      </div>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo papel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome exibido</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: Escola de Líderes"
              />
            </div>
            <div>
              <Label className="text-xs">Identificador (opcional)</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Ex: escola_lideres (gerado automaticamente)"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Apenas letras minúsculas, números e _. Será derivado do nome se vazio.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRole} disabled={creating}>
              {creating && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRoles;