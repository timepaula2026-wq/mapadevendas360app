import { User, Shield, Bell, Pencil } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import EditProfileDialog from "@/components/EditProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ProfileSidebarProps {
  open: boolean;
  onClose: () => void;
}

const ProfileSidebar = ({ open, onClose }: ProfileSidebarProps) => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    phone: string | null;
    unit: string | null;
    unit_start_date: string | null;
    avatar_url: string | null;
  } | null>(null);

  const loadProfile = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, unit, unit_start_date, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-72 bg-card border-border p-0">
        <SheetHeader className="p-5 pb-0">
          <SheetTitle className="sr-only">Perfil</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center pt-8 pb-6 px-5">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-base font-bold text-foreground text-center">
            {profile?.display_name || user?.email}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors">
            <NotificationBell />
            <span className="text-sm font-medium text-foreground">Notificações</span>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Pencil className="w-5 h-5" />
            Editar perfil
          </button>
        </div>

        <div className="border-t border-border mx-4" />

        <div className="px-5 py-4 space-y-3">
          {profile?.phone && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Telefone</p>
              <p className="text-sm text-foreground">{profile.phone}</p>
            </div>
          )}
          {profile?.unit && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Unidade</p>
              <p className="text-sm text-foreground">{profile.unit}</p>
            </div>
          )}
          {profile?.unit_start_date && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Início na unidade</p>
              <p className="text-sm text-foreground">
                {new Date(profile.unit_start_date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </div>

        {isAdmin && (
          <>
            <div className="border-t border-border mx-4" />
            <div className="px-5 py-4">
              <button
                onClick={() => { navigate("/admin"); onClose(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Painel Admin
              </button>
            </div>
          </>
        )}
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={loadProfile}
        />
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSidebar;
