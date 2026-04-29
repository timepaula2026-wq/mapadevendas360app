import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Image, Youtube, ExternalLink, ArrowRight, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface BannerSlide {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  youtube_id: string | null;
  type: string;
  link_type: string;
  link_url: string | null;
  sort_order: number | null;
  active: boolean | null;
}

const internalRoutes = [
  { label: "Trilha do Iniciante", value: "/trilha" },
  { label: "Central de Vendas", value: "/vendas" },
  { label: "Ferramentas", value: "/ferramentas" },
  { label: "Treinamentos", value: "/trainings" },
  { label: "Plano de Carreira", value: "/carreira" },
  { label: "Apresentação de Produtos", value: "/apresentacao" },
  { label: "Sorteios", value: "/sorteios" },
  { label: "Liberação de Crédito", value: "/credito" },
  { label: "Jornada Impacto", value: "/jornada" },
  { label: "Gestão de Equipe", value: "/equipe" },
  { label: "Área do Cliente", value: "/cliente" },
  { label: "Plataforma de Análise", value: "/analise" },
  { label: "Loja", value: "/loja" },
  { label: "Locação", value: "/locacao" },
];

const AdminBannerSlides = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Form state
  const [type, setType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<globalThis.File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [linkType, setLinkType] = useState<"none" | "internal" | "external">("none");
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banner_slides")
      .select("*")
      .order("sort_order", { ascending: true });
    setSlides((data as BannerSlide[]) || []);
    setLoading(false);
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSave = async () => {
    setSaving(true);
    let finalImageUrl: string | null = null;

    // Upload image file if present
    if (type === "image" && imageFile) {
      setUploading(true);
      const ext = imageFile.name.split(".").pop();
      const filePath = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("banner-images")
        .upload(filePath, imageFile);
      if (uploadError) {
        toast.error("Erro ao fazer upload: " + uploadError.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("banner-images").getPublicUrl(filePath);
      finalImageUrl = urlData.publicUrl;
      setUploading(false);
    }

    const ytId = type === "video" ? extractYoutubeId(youtubeUrl) : null;

    const { error } = await supabase.from("banner_slides").insert({
      title: title.trim() || null,
      description: description.trim() || null,
      type,
      image_url: finalImageUrl,
      youtube_id: ytId,
      video_url: type === "video" ? youtubeUrl.trim() : null,
      link_type: linkType,
      link_url: linkType !== "none" ? linkUrl.trim() : null,
      sort_order: slides.length,
      active: true,
    });

    if (error) toast.error("Erro ao salvar slide");
    else {
      toast.success("Slide adicionado!");
      resetForm();
      fetchSlides();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("banner_slides").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Slide removido!"); fetchSlides(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("banner_slides").update({ active: !current }).eq("id", id);
    fetchSlides();
  };

  const resetForm = () => {
    setShowForm(false);
    setType("image");
    setTitle("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setYoutubeUrl("");
    setLinkType("none");
    setLinkUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(true)} className="w-full gap-2">
        <Plus className="w-4 h-4" /> Novo Slide
      </Button>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Novo Slide do Carrossel</h3>

          {/* Type */}
          <div className="flex gap-2">
            <button
              onClick={() => setType("image")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === "image" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Image className="w-4 h-4" /> Foto
            </button>
            <button
              onClick={() => setType("video")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === "video" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              <Youtube className="w-4 h-4" /> Vídeo
            </button>
          </div>

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)" className="h-9 text-sm" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição / legenda (opcional)"
            rows={2}
            maxLength={300}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          {type === "image" ? (
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Clique para selecionar uma imagem</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="URL do YouTube" className="h-9 text-sm" />
          )}

          {/* Link type */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Ao clicar, ir para:</p>
            <div className="flex gap-1.5">
              {([
                { val: "none" as const, label: "Nenhum" },
                { val: "internal" as const, label: "Seção do App" },
                { val: "external" as const, label: "Link Externo" },
              ]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => { setLinkType(val); setLinkUrl(""); }}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                    linkType === val ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {linkType === "internal" && (
            <select
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Selecione uma seção</option>
              {internalRoutes.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          )}

          {linkType === "external" && (
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || uploading || (type === "image" && !imageFile) || (type === "video" && !youtubeUrl.trim())} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Slides list */}
      <div className="space-y-2">
        {slides.map((slide) => (
          <div key={slide.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${slide.active ? "bg-card border-border" : "bg-muted/50 border-border/50 opacity-60"}`}>
            {/* Thumbnail */}
            <div className="w-16 h-10 rounded-lg overflow-hidden bg-secondary shrink-0">
              {slide.type === "image" && slide.image_url ? (
                <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
              ) : slide.youtube_id ? (
                <img src={`https://img.youtube.com/vi/${slide.youtube_id}/default.jpg`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{slide.title || (slide.type === "video" ? "Vídeo" : "Imagem")}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {slide.type === "video" ? (
                  <Youtube className="w-3 h-3 text-destructive" />
                ) : (
                  <Image className="w-3 h-3 text-primary" />
                )}
                {slide.link_type !== "none" && (
                  <>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    {slide.link_type === "external" ? (
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground truncate">{slide.link_url}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => toggleActive(slide.id, !!slide.active)}
                className={`px-2 py-1 rounded text-[10px] font-medium ${slide.active ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"}`}
              >
                {slide.active ? "Ativo" : "Inativo"}
              </button>
              <button onClick={() => handleDelete(slide.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {slides.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">Nenhum slide cadastrado. O carrossel padrão será exibido.</p>
        )}
      </div>
    </div>
  );
};

export default AdminBannerSlides;
