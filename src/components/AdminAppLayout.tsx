import { useEffect, useState } from "react";
import { Loader2, Save, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { AppSettings } from "@/hooks/useAppSettings";

const PRESET_COLORS = [
  { label: "Burgundy (padrão)", value: "348 70% 35%" },
  { label: "Azul", value: "217 91% 50%" },
  { label: "Verde", value: "142 71% 35%" },
  { label: "Roxo", value: "270 70% 50%" },
  { label: "Laranja", value: "25 95% 53%" },
];

const AdminAppLayout = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as AppSettings);
        setLoading(false);
      });
  }, []);

  const update = (patch: Partial<AppSettings>) =>
    setSettings((s) => (s ? { ...s, ...patch } : s));

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        primary_color: settings.primary_color,
        background_color: settings.background_color,
        text_color: settings.text_color,
        header_title: settings.header_title,
        header_logo_url: settings.header_logo_url,
        header_alignment: settings.header_alignment,
        show_header: settings.show_header,
        display_mode: settings.display_mode,
        favicon_url: settings.favicon_url,
        grid_cols_mobile: settings.grid_cols_mobile,
        grid_cols_tablet: settings.grid_cols_tablet,
        grid_cols_desktop: settings.grid_cols_desktop,
        icon_size_mobile: settings.icon_size_mobile,
        icon_size_tablet: settings.icon_size_tablet,
        icon_size_desktop: settings.icon_size_desktop,
      })
      .eq("id", "default");
    setSaving(false);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Layout atualizado!");
  };

  const uploadImage = async (file: globalThis.File, field: "header_logo_url" | "favicon_url") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `app-settings/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banner-images").upload(path, file);
    if (error) {
      toast.error("Erro no upload: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("banner-images").getPublicUrl(path);
    update({ [field]: data.publicUrl } as Partial<AppSettings>);
    setUploading(false);
    toast.success("Imagem enviada (lembre de salvar)");
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Personalize cores, cabeçalho e modo de exibição do aplicativo.
      </p>

      {/* Cores */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Cores do App</h3>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor primária</Label>
          <div className="flex gap-2">
            <Select value={settings.primary_color} onValueChange={(v) => update({ primary_color: v })}>
              <SelectTrigger className="h-9 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-9 h-9 rounded-md border border-border" style={{ backgroundColor: `hsl(${settings.primary_color})` }} />
          </div>
          <Input
            value={settings.primary_color}
            onChange={(e) => update({ primary_color: e.target.value })}
            placeholder="HSL: ex 348 70% 35%"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor de fundo (HSL)</Label>
          <div className="flex gap-2">
            <Input
              value={settings.background_color}
              onChange={(e) => update({ background_color: e.target.value })}
              className="h-8 text-xs flex-1"
            />
            <div className="w-9 h-9 rounded-md border border-border" style={{ backgroundColor: `hsl(${settings.background_color})` }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Cor do texto (HSL)</Label>
          <div className="flex gap-2">
            <Input
              value={settings.text_color}
              onChange={(e) => update({ text_color: e.target.value })}
              className="h-8 text-xs flex-1"
            />
            <div className="w-9 h-9 rounded-md border border-border" style={{ backgroundColor: `hsl(${settings.text_color})` }} />
          </div>
        </div>
      </section>

      {/* Cabeçalho */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Cabeçalho</h3>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Exibir cabeçalho</Label>
          <Switch checked={settings.show_header} onCheckedChange={(v) => update({ show_header: v })} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Título</Label>
          <Input
            value={settings.header_title}
            onChange={(e) => update({ header_title: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Alinhamento</Label>
          <Select value={settings.header_alignment} onValueChange={(v) => update({ header_alignment: v })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Esquerda</SelectItem>
              <SelectItem value="center" className="text-xs">Centro</SelectItem>
              <SelectItem value="right" className="text-xs">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Logo (opcional)</Label>
          {settings.header_logo_url && (
            <img src={settings.header_logo_url} alt="Logo" className="w-16 h-16 object-contain rounded border border-border bg-secondary" />
          )}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadImage(f, "header_logo_url");
            }}
            className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground"
          />
        </div>
      </section>

      {/* Modo de exibição */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Modo de exibição da tela inicial</h3>
        <div className="flex gap-2">
          {[
            { value: "grid", label: "Grade" },
            { value: "list", label: "Lista" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => update({ display_mode: m.value })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                settings.display_mode === m.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* Favicon */}
      <section className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-semibold">Favicon (ícone do navegador)</h3>
        {settings.favicon_url && (
          <img src={settings.favicon_url} alt="Favicon" className="w-10 h-10 object-contain rounded border border-border" />
        )}
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadImage(f, "favicon_url");
          }}
          className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground"
        />
      </section>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar alterações
      </Button>
    </div>
  );
};

export default AdminAppLayout;