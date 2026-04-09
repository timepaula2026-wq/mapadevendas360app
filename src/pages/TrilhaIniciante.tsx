import { ArrowLeft, Rocket, PlayCircle, Lock, Loader2, Plus, Trash2, Edit2, Youtube, FileText, File, Upload, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ContentViewerModal from "@/components/ContentViewerModal";

interface TrilhaItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  youtube_id: string | null;
  sort_order: number | null;
}

const TrilhaIniciante = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [items, setItems] = useState<TrilhaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"youtube" | "pdf" | "link">("youtube");
  const [formUrl, setFormUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContent, setViewerContent] = useState<{ title: string; type: string; url?: string | null; youtube_id?: string | null } | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("section_contents")
      .select("*")
      .eq("section_id", "trilha-modulos")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Erro ao carregar módulos");
    else setItems(data || []);
    setLoading(false);
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !user) return;

    if (formType === "pdf" && fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      setUploading(true);
      const filePath = `trilha/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("training-files").upload(filePath, file);
      if (uploadError) { toast.error("Erro no upload"); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(filePath);
      
      if (editingId) {
        await supabase.from("section_contents").update({ title: formTitle.trim(), description: formDescription.trim() || null, type: "pdf", url: urlData.publicUrl, youtube_id: null }).eq("id", editingId);
      } else {
        await supabase.from("section_contents").insert({ section_id: "trilha-modulos", user_id: user.id, title: formTitle.trim(), description: formDescription.trim() || null, type: "pdf", url: urlData.publicUrl, sort_order: items.length });
      }
      setUploading(false);
    } else {
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        type: formType,
        url: formUrl || null,
        youtube_id: formType === "youtube" ? extractYoutubeId(formUrl) : null,
      };

      if (editingId) {
        await supabase.from("section_contents").update(payload).eq("id", editingId);
      } else {
        await supabase.from("section_contents").insert({ ...payload, section_id: "trilha-modulos", user_id: user.id, sort_order: items.length });
      }
    }

    toast.success(editingId ? "Módulo atualizado!" : "Módulo adicionado!");
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("section_contents").delete().eq("id", id);
    toast.success("Módulo removido!");
    fetchItems();
  };

  const handleEdit = (item: TrilhaItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || "");
    setFormType(item.type as "youtube" | "pdf" | "link");
    setFormUrl(item.url || "");
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormDescription("");
    setFormType("youtube");
    setFormUrl("");
  };

  const handleOpen = (item: TrilhaItem) => {
    setViewerContent({ title: item.title, type: item.type, url: item.url, youtube_id: item.youtube_id });
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Trilha do Iniciante</h1>
        </div>
        <p className="text-white/70 text-sm">Comece sua jornada de sucesso em vendas.</p>
      </div>

      <div className="px-5 mt-6">
        {/* Termo de Correspondente */}
        <div
          onClick={() => navigate("/termo-correspondente")}
          className="flex items-center gap-4 p-4 rounded-xl border bg-card border-primary/30 cursor-pointer hover:bg-accent/50 transition-colors mb-4"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Termo de Correspondente Comercial</p>
            <p className="text-xs text-muted-foreground">Leia e assine o termo para iniciar</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
        </div>

        {isAdmin && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full mb-4 gap-2">
            <Plus className="w-4 h-4" /> Adicionar Módulo
          </Button>
        )}

        {isAdmin && showForm && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">{editingId ? "Editar Módulo" : "Novo Módulo"}</h3>
            <div className="flex gap-1">
              {([
                { type: "youtube" as const, icon: Youtube, label: "YouTube" },
                { type: "pdf" as const, icon: Upload, label: "PDF" },
                { type: "link" as const, icon: File, label: "Link" },
              ]).map(({ type, icon: Icon, label }) => (
                <button key={type} onClick={() => setFormType(type)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium ${formType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Título do módulo" />
            <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição (opcional)" />
            {formType === "pdf" ? (
              <input ref={fileInputRef} type="file" accept=".pdf"
                className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground" />
            ) : (
              <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder={formType === "youtube" ? "URL do YouTube" : "URL do conteúdo"} />
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!formTitle.trim() || uploading} className="flex-1">
                {uploading ? "Enviando..." : editingId ? "Salvar" : "Adicionar"}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Rocket className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum módulo cadastrado ainda.</p>
            {isAdmin && <p className="text-xs mt-1">Use o botão acima para adicionar módulos.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleOpen(item)}>
                <div className="flex-shrink-0">
                  {item.type === "youtube" ? <PlayCircle className="w-6 h-6 text-primary" /> :
                   item.type === "pdf" ? <FileText className="w-6 h-6 text-blue-500" /> :
                   <File className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground mr-2">Módulo {i + 1}</span>
                  {isAdmin && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1 text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewerContent && (
        <ContentViewerModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={viewerContent.title}
          type={viewerContent.type}
          url={viewerContent.url ?? null}
          youtubeId={viewerContent.youtube_id ?? null}
        />
      )}
    </div>
  );
};

export default TrilhaIniciante;
