import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UNITS } from "@/lib/units";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const EditProfileDialog = ({ open, onClose, onSaved }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [unitStartDate, setUnitStartDate] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("display_name, phone, unit, unit_start_date, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setPhone(data.phone || "");
          const u = data.unit || "";
          if (u && !UNITS.includes(u)) {
            setUnit("outra");
            setCustomUnit(u);
          } else {
            setUnit(u);
            setCustomUnit("");
          }
          setUnitStartDate(data.unit_start_date || "");
          setAvatarUrl((data as any).avatar_url || null);
        }
        setLoading(false);
      });
  }, [open, user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast.error("Erro ao enviar foto");
      setUploadingAvatar(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("user_id", user.id);
    if (updErr) {
      toast.error("Erro ao salvar foto no perfil");
    } else {
      setAvatarUrl(url);
      toast.success("Foto atualizada!");
      onSaved?.();
    }
    setUploadingAvatar(false);
  };

  const removeAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", user.id);
    if (error) toast.error("Erro ao remover foto");
    else {
      setAvatarUrl(null);
      toast.success("Foto removida");
      onSaved?.();
    }
    setUploadingAvatar(false);
  };

  const save = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    const finalUnit = unit === "outra" ? customUnit.trim() : unit;
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        toast.error("A nova senha precisa de pelo menos 6 caracteres");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        phone: phone.replace(/\D/g, "") || null,
        unit: finalUnit || null,
        unit_start_date: unitStartDate || null,
      })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar perfil");
      setSaving(false);
      return;
    }
    if (newPassword) {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
      if (pwErr) {
        toast.error("Perfil salvo, mas falhou ao trocar a senha");
        setSaving(false);
        return;
      }
    }
    toast.success("Perfil atualizado!");
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>Atualize seus dados pessoais e senha.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Foto de perfil */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center border border-border">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:opacity-90"
                  title="Trocar foto"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </div>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                  className="text-[11px] text-destructive flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone (WhatsApp)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11999999999"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-secondary rounded-md px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecione…</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="outra">Outra</option>
              </select>
              {unit === "outra" && (
                <Input
                  className="mt-2"
                  placeholder="Digite o nome da unidade"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Início na unidade</Label>
              <Input
                type="date"
                value={unitStartDate}
                onChange={(e) => setUnitStartDate(e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Alterar senha (opcional)
              </p>
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;