import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Youtube, FileText, File, Upload, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SectionContent {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  youtube_id: string | null;
}

const SECTIONS = [
  { id: "trilha", label: "Trilha do Iniciante" },
  { id: "vendas", label: "Central de Vendas & CRM" },
  { id: "ferramentas", label: "Acessos de Ferramentas" },
  { id: "carreira", label: "Plano de Carreira" },
  { id: "apresentacao", label: "Apresentação de Produtos" },
  { id: "sorteios", label: "Sorteios & Comunicados" },
  { id: "credito", label: "Liberação de Crédito" },
  { id: "jornada", label: "Jornada Impacto" },
  { id: "equipe", label: "Gestão de Equipe" },
  { id: "cliente", label: "Área do Cliente" },
  { id: "analise", label: "Plataforma de Análise" },
];

const AdminSections = () => {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionContents, setSectionContents] = useState<Record<string, SectionContent[]>>({});
  const [showForm, setShowForm] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentDesc, setContentDesc] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "pdf" | "link">("youtube");
  const [contentUrl, setContentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSectionContents = async (sectionId: string) => {
    const { data } = await supabase
      .from("section_contents")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });
    setSectionContents((prev) => ({ ...prev, [sectionId]: (data as SectionContent[]) || [] }));
  };

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      if (!sectionContents[sectionId]) fetchSectionContents(sectionId);
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleFileUpload = async (file: globalThis.File, sectionId: string) => {
    if (!user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `sections/${sectionId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("training-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("training-files")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      user_id: user.id,
      title: contentTitle.trim() || file.name,
      description: contentDesc.trim() || null,
      type: "pdf",
      url: urlData.publicUrl,
    });

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("PDF enviado!");
      resetContentForm();
      fetchSectionContents(sectionId);
    }
    setUploading(false);
  };

  const handleAddContent = async (sectionId: string) => {
    if (!contentTitle.trim() || !user) return;

    if (contentType === "pdf" && fileInputRef.current?.files?.[0]) {
      await handleFileUpload(fileInputRef.current.files[0], sectionId);
      return;
    }

    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      user_id: user.id,
      title: contentTitle.trim(),
      description: contentDesc.trim() || null,
      type: contentType,
      url: contentUrl || null,
      youtube_id: contentType === "youtube" ? extractYoutubeId(contentUrl) : null,
    });

    if (error) toast.error("Erro ao adicionar");
    else {
      toast.success("Conteúdo adicionado!");
      resetContentForm();
      fetchSectionContents(sectionId);
    }
  };

  const handleDeleteContent = async (contentId: string, sectionId: string) => {
    const { error } = await supabase.from("section_contents").delete().eq("id", contentId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Removido!");
      fetchSectionContents(sectionId);
    }
  };

  const resetContentForm = () => {
    setShowForm(null);
    setContentTitle("");
    setContentDesc("");
    setContentUrl("");
    setContentType("youtube");
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Gerencie o conteúdo de cada seção do aplicativo.
      </p>
      {SECTIONS.map((section) => (
        <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{section.label}</span>
            <div className="flex items-center gap-2">
              {sectionContents[section.id] && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {sectionContents[section.id].length}
                </span>
              )}
              {expandedSection === section.id ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedSection === section.id && (
            <div className="border-t border-border p-3 space-y-2">
              {/* Content list */}
              {sectionContents[section.id]?.map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1.5">
                  {c.type === "youtube" ? <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" /> :
                   c.type === "pdf" ? <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> :
                   <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <span className="text-foreground text-xs truncate flex-1">{c.title}</span>
                  <button onClick={() => handleDeleteContent(c.id, section.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {sectionContents[section.id]?.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum conteúdo</p>
              )}

              {/* Add button */}
              {showForm !== section.id && (
                <button
                  onClick={() => setShowForm(section.id)}
                  className="w-full flex items-center justify-center gap-1 py-2 text-xs text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar conteúdo
                </button>
              )}

              {/* Add form */}
              {showForm === section.id && (
                <div className="p-3 bg-secondary rounded-lg space-y-2">
                  <div className="flex gap-1">
                    {([
                      { type: "youtube" as const, icon: Youtube, label: "YouTube" },
                      { type: "pdf" as const, icon: Upload, label: "PDF" },
                      { type: "link" as const, icon: File, label: "Link" },
                    ]).map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setContentType(type)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium ${
                          contentType === type
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {label}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="Título"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={contentDesc}
                    onChange={(e) => setContentDesc(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="h-8 text-xs"
                  />
                  {contentType === "pdf" ? (
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  ) : (
                    <Input
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                      placeholder={contentType === "youtube" ? "URL do YouTube" : "URL do link"}
                      className="h-8 text-xs"
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddContent(section.id)}
                      disabled={!contentTitle.trim() || uploading}
                      size="sm"
                      className="flex-1 text-xs gap-1"
                    >
                      {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</> : "Adicionar"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetContentForm} className="text-xs">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminSections;
