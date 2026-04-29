import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Youtube,
  FileText,
  File,
  Upload,
  Loader2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { compressImage } from "@/lib/compressImage";
import AdminIconOrder from "@/components/AdminIconOrder";
import { DEFAULT_GRID_SECTIONS, DEFAULT_SECTION_LABELS } from "@/lib/sections";

interface SectionContent {
  id: string;
  section_id: string;
  tab_id: string | null;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  youtube_id: string | null;
  sort_order: number | null;
  allow_download?: boolean | null;
}

interface SectionTab {
  id: string;
  section_id: string;
  title: string;
  sort_order: number | null;
}

const AdminSections = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<{ id: string; label: string }[]>(DEFAULT_GRID_SECTIONS.map(({ id, label }) => ({ id, label })));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<string | null>(null);
  const [tabsBySection, setTabsBySection] = useState<Record<string, SectionTab[]>>({});
  const [contentsByTab, setContentsByTab] = useState<Record<string, SectionContent[]>>({});
  const [orphansBySection, setOrphansBySection] = useState<Record<string, SectionContent[]>>({});
  const [newTabTitle, setNewTabTitle] = useState<Record<string, string>>({});
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editTabTitle, setEditTabTitle] = useState("");

  // Edit content state
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [editContentTitle, setEditContentTitle] = useState("");
  const [editContentDesc, setEditContentDesc] = useState("");
  const [editContentUrl, setEditContentUrl] = useState("");
  const [editContentType, setEditContentType] = useState<"youtube" | "pdf" | "link" | "image" | "video">("link");
  const [editContentAllowDownload, setEditContentAllowDownload] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editUploading, setEditUploading] = useState(false);

  // Form for adding content to a tab
  const [showForm, setShowForm] = useState<string | null>(null); // tabId
  const [contentTitle, setContentTitle] = useState("");
  const [contentDesc, setContentDesc] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "pdf" | "link" | "image" | "video">("youtube");
  const [contentUrl, setContentUrl] = useState("");
  const [contentAllowDownload, setContentAllowDownload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSections = async () => {
    const { data } = await supabase
      .from("icon_grid_order")
      .select("id, sort_order, visible, custom_label, is_custom")
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      const merged = (data as Array<{
        id: string; sort_order: number; visible: boolean;
        custom_label?: string | null; is_custom?: boolean | null;
      }>)
        .filter((d) => d.visible && (DEFAULT_SECTION_LABELS[d.id] || d.is_custom))
        .map((d) => ({ id: d.id, label: d.custom_label || DEFAULT_SECTION_LABELS[d.id] || d.id }));
      if (merged.length > 0) setSections(merged);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchTabs = async (sectionId: string) => {
    const { data } = await supabase
      .from("section_tabs")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setTabsBySection((prev) => ({ ...prev, [sectionId]: (data as SectionTab[]) || [] }));
  };

  const fetchOrphans = async (sectionId: string) => {
    const { data } = await supabase
      .from("section_contents")
      .select("*")
      .eq("section_id", sectionId)
      .is("tab_id", null)
      .order("created_at", { ascending: true });
    setOrphansBySection((prev) => ({ ...prev, [sectionId]: (data as SectionContent[]) || [] }));
  };

  const fetchTabContents = async (tabId: string) => {
    const { data } = await supabase
      .from("section_contents")
      .select("*")
      .eq("tab_id", tabId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setContentsByTab((prev) => ({ ...prev, [tabId]: (data as SectionContent[]) || [] }));
  };

  const toggleSection = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      if (!tabsBySection[sectionId]) fetchTabs(sectionId);
      fetchOrphans(sectionId);
    }
  };

  const toggleTab = (tabId: string) => {
    if (expandedTab === tabId) {
      setExpandedTab(null);
    } else {
      setExpandedTab(tabId);
      if (!contentsByTab[tabId]) fetchTabContents(tabId);
    }
  };

  const handleAddTab = async (sectionId: string) => {
    const title = (newTabTitle[sectionId] || "").trim();
    if (!title) return;
    const order = tabsBySection[sectionId]?.length ?? 0;
    const { error } = await supabase
      .from("section_tabs")
      .insert({ section_id: sectionId, title, sort_order: order });
    if (error) toast.error("Erro ao criar aba");
    else {
      toast.success("Aba criada!");
      setNewTabTitle((prev) => ({ ...prev, [sectionId]: "" }));
      fetchTabs(sectionId);
    }
  };

  const handleRenameTab = async (tabId: string, sectionId: string) => {
    if (!editTabTitle.trim()) return;
    const { error } = await supabase
      .from("section_tabs")
      .update({ title: editTabTitle.trim() })
      .eq("id", tabId);
    if (error) toast.error("Erro ao renomear");
    else {
      toast.success("Renomeada!");
      setEditingTab(null);
      fetchTabs(sectionId);
    }
  };

  const handleDeleteTab = async (tabId: string, sectionId: string) => {
    if (!confirm("Excluir esta aba e todos os seus conteúdos?")) return;
    const { error } = await supabase.from("section_tabs").delete().eq("id", tabId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Aba removida");
      fetchTabs(sectionId);
    }
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const resetContentForm = () => {
    setShowForm(null);
    setContentTitle("");
    setContentDesc("");
    setContentUrl("");
    setContentType("youtube");
    setContentAllowDownload(false);
  };

  const handleFileUpload = async (
    file: globalThis.File,
    sectionId: string,
    tabId: string,
    forcedType?: "pdf" | "image" | "video"
  ) => {
    if (!user) return;
    setUploading(true);
    // Comprime imagens grandes antes do upload para abrir mais rápido
    let toUpload = file;
    if (/^image\//i.test(file.type)) {
      try {
        toUpload = await compressImage(file);
      } catch {
        /* mantém original em caso de falha */
      }
    }
    const fileExt = toUpload.name.split(".").pop();
    const filePath = `sections/${sectionId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("training-files")
      .upload(filePath, toUpload, {
        cacheControl: "31536000",
        contentType: toUpload.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(filePath);

    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(toUpload.name);
    const isVideo = /\.(mp4|webm|mov|m4v|ogv)$/i.test(toUpload.name);
    const resolvedType = forcedType ?? (isVideo ? "video" : isImage ? "image" : "pdf");
    const nextOrder = contentsByTab[tabId]?.length ?? 0;
    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      tab_id: tabId,
      user_id: user.id,
      title: contentTitle.trim() || file.name,
      description: contentDesc.trim() || null,
      type: resolvedType,
      url: urlData.publicUrl,
      sort_order: nextOrder,
      allow_download: resolvedType === "pdf" ? contentAllowDownload : false,
    });

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success(
        resolvedType === "video"
          ? "Vídeo enviado!"
          : resolvedType === "image"
          ? "Imagem enviada!"
          : "PDF enviado!"
      );
      resetContentForm();
      fetchTabContents(tabId);
    }
    setUploading(false);
  };

  const handleAddContent = async (sectionId: string, tabId: string) => {
    if (!contentTitle.trim() || !user) return;

    // Validações de upload/URL
    if (contentType === "pdf" || contentType === "image" || contentType === "video") {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        toast.error(
          contentType === "pdf"
            ? "Selecione um arquivo PDF"
            : contentType === "image"
            ? "Selecione uma imagem"
            : "Selecione um arquivo de vídeo (MP4)"
        );
        return;
      }
      await handleFileUpload(file, sectionId, tabId, contentType);
      return;
    }

    if (!contentUrl.trim()) {
      toast.error(contentType === "youtube" ? "Informe a URL do vídeo" : "Informe a URL do link");
      return;
    }

    const nextOrder = contentsByTab[tabId]?.length ?? 0;
    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      tab_id: tabId,
      user_id: user.id,
      title: contentTitle.trim(),
      description: contentDesc.trim() || null,
      type: contentType,
      url: contentUrl.trim(),
      youtube_id: contentType === "youtube" ? extractYoutubeId(contentUrl) : null,
      sort_order: nextOrder,
      allow_download: false,
    });

    if (error) toast.error("Erro ao adicionar");
    else {
      toast.success("Conteúdo adicionado!");
      resetContentForm();
      fetchTabContents(tabId);
    }
  };

  const handleDeleteContent = async (contentId: string, tabId: string) => {
    const { error } = await supabase.from("section_contents").delete().eq("id", contentId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Removido!");
      fetchTabContents(tabId);
    }
  };

  const handleAssignOrphan = async (contentId: string, tabId: string, sectionId: string) => {
    const { error } = await supabase
      .from("section_contents")
      .update({ tab_id: tabId })
      .eq("id", contentId);
    if (error) toast.error("Erro ao mover");
    else {
      toast.success("Movido para a aba!");
      fetchOrphans(sectionId);
      if (contentsByTab[tabId]) fetchTabContents(tabId);
    }
  };

  const handleDeleteOrphan = async (contentId: string, sectionId: string) => {
    if (!confirm("Excluir este conteúdo?")) return;
    const { error } = await supabase.from("section_contents").delete().eq("id", contentId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Removido!");
      fetchOrphans(sectionId);
    }
  };

  const handleMoveContent = async (
    contentId: string,
    fromTabId: string,
    toTabId: string,
    sectionId: string
  ) => {
    if (!toTabId || toTabId === fromTabId) return;
    const { error } = await supabase
      .from("section_contents")
      .update({ tab_id: toTabId })
      .eq("id", contentId);
    if (error) toast.error("Erro ao mover");
    else {
      toast.success("Movido!");
      fetchTabContents(fromTabId);
      if (contentsByTab[toTabId]) fetchTabContents(toTabId);
      fetchOrphans(sectionId);
    }
  };

  // Reordena a lista inteira e persiste TODOS os sort_order como 0..N-1.
  // Isso evita índices duplicados e mantém a ordem estável mesmo com cliques rápidos.
  const persistReindex = async (
    table: "section_contents" | "section_tabs",
    items: { id: string }[]
  ) => {
    const results = await Promise.all(
      items.map((it, i) =>
        supabase.from(table).update({ sort_order: i }).eq("id", it.id)
      )
    );
    return results.every((r) => !r.error);
  };

  const handleReorderContent = async (tabId: string, index: number, direction: -1 | 1) => {
    const list = contentsByTab[tabId];
    if (!list) return;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    // Swap visual e reindex sequencial (0..N-1)
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    const reindexed = next.map((c, i) => ({ ...c, sort_order: i }));
    setContentsByTab((prev) => ({ ...prev, [tabId]: reindexed }));
    const ok = await persistReindex("section_contents", reindexed);
    if (!ok) {
      toast.error("Erro ao reordenar");
      fetchTabContents(tabId);
    }
  };

  const handleReorderTab = async (sectionId: string, index: number, direction: -1 | 1) => {
    const list = tabsBySection[sectionId];
    if (!list) return;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    const reindexed = next.map((t, i) => ({ ...t, sort_order: i }));
    setTabsBySection((prev) => ({ ...prev, [sectionId]: reindexed }));
    const ok = await persistReindex("section_tabs", reindexed);
    if (!ok) {
      toast.error("Erro ao reordenar abas");
      fetchTabs(sectionId);
    }
  };

  const startEditContent = (c: SectionContent) => {
    setEditingContent(c.id);
    setEditContentTitle(c.title);
    setEditContentDesc(c.description || "");
    setEditContentUrl(c.url || "");
    setEditContentType((c.type as "youtube" | "pdf" | "link" | "image" | "video") || "link");
    setEditContentAllowDownload(!!(c as unknown as { allow_download?: boolean }).allow_download);
  };

  const handleSaveEditContent = async (contentId: string, tabId: string, _origType: string) => {
    if (!editContentTitle.trim()) return;
    const type = editContentType;
    // Buscar URL atual do conteúdo para preservar se nada novo for fornecido
    const currentContent = contentsByTab[tabId]?.find((c) => c.id === contentId);
    const currentUrl = currentContent?.url || null;
    const updates: Record<string, unknown> = {
      title: editContentTitle.trim(),
      description: editContentDesc.trim() || null,
      type,
      allow_download: type === "pdf" ? editContentAllowDownload : false,
    };
    // Se trocou para PDF/Imagem e selecionou arquivo, faz upload
    const file = editFileInputRef.current?.files?.[0];
    if ((type === "pdf" || type === "image" || type === "video") && file) {
      setEditUploading(true);
      let toUpload = file;
      if (/^image\//i.test(file.type)) {
        try {
          toUpload = await compressImage(file);
        } catch {
          /* mantém original em caso de falha */
        }
      }
      const fileExt = toUpload.name.split(".").pop();
      const filePath = `sections/edit/${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage
        .from("training-files")
        .upload(filePath, toUpload, {
          cacheControl: "31536000",
          contentType: toUpload.type || undefined,
          upsert: false,
        });
      if (upErr) {
        toast.error("Erro no upload: " + upErr.message);
        setEditUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(filePath);
      updates.url = urlData.publicUrl;
      updates.youtube_id = null;
      setEditUploading(false);
    } else if (type === "pdf" || type === "image" || type === "video") {
      // Sem novo arquivo: exigir que já exista URL salva
      if (!currentUrl) {
        toast.error(
          type === "pdf"
            ? "Selecione um arquivo PDF"
            : type === "image"
            ? "Selecione uma imagem"
            : "Selecione um arquivo de vídeo (MP4)"
        );
        return;
      }
      // mantém URL atual
    } else {
      // Tipos baseados em URL (youtube/link)
      if (!editContentUrl.trim()) {
        toast.error(type === "youtube" ? "Informe a URL do vídeo" : "Informe a URL do link");
        return;
      }
      updates.url = editContentUrl.trim();
      if (type === "youtube") {
        updates.youtube_id = extractYoutubeId(editContentUrl);
      } else {
        updates.youtube_id = null;
      }
    }
    const { error } = await supabase
      .from("section_contents")
      .update(updates)
      .eq("id", contentId);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Atualizado!");
      setEditingContent(null);
      fetchTabContents(tabId);
    }
  };

  return (
    <div className="space-y-2">
      <details className="bg-card border border-border rounded-xl overflow-hidden mb-3" open>
        <summary className="cursor-pointer p-3 text-sm font-medium text-foreground hover:bg-secondary/50">
          Ordem e nomes dos ícones da tela inicial
        </summary>
        <div className="p-3 border-t border-border">
          <AdminIconOrder />
        </div>
      </details>
      <p className="text-xs text-muted-foreground mb-3">
        Cada seção tem abas (temas). Adicione conteúdos dentro de cada aba. O nome exibido é o mesmo configurado acima.
      </p>
      {sections.map((section) => (
        <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{section.label}</span>
            <div className="flex items-center gap-2">
              {tabsBySection[section.id] && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {tabsBySection[section.id].length} abas
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
              {/* Conteúdos órfãos (sem aba) */}
              {(orphansBySection[section.id]?.length ?? 0) > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 space-y-2 mb-2">
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    {orphansBySection[section.id].length} conteúdo(s) sem aba — atribua a uma aba abaixo:
                  </p>
                  {orphansBySection[section.id].map((c) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 bg-card rounded">
                      {c.type === "youtube" ? (
                        <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      ) : c.type === "pdf" ? (
                        <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs flex-1 truncate">{c.title}</span>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignOrphan(c.id, e.target.value, section.id);
                        }}
                        className="h-7 text-[11px] rounded border border-border bg-background px-1 max-w-[140px]"
                      >
                        <option value="" disabled>
                          {(tabsBySection[section.id]?.length ?? 0) === 0
                            ? "Crie uma aba"
                            : "Mover para..."}
                        </option>
                        {tabsBySection[section.id]?.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteOrphan(c.id, section.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs list */}
              {(tabsBySection[section.id]?.length ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma aba criada</p>
              )}

              {tabsBySection[section.id]?.map((tab, tabIdx) => (
                <div key={tab.id} className="bg-secondary/40 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-1 p-2">
                    <button
                      onClick={() => toggleTab(tab.id)}
                      className="flex items-center gap-1 flex-1 text-left"
                    >
                      {expandedTab === tab.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {editingTab === tab.id ? (
                        <Input
                          value={editTabTitle}
                          onChange={(e) => setEditTabTitle(e.target.value)}
                          className="h-6 text-xs"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs font-medium text-foreground">{tab.title}</span>
                      )}
                    </button>
                    {editingTab === tab.id ? (
                      <>
                        <button
                          onClick={() => handleRenameTab(tab.id, section.id)}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTab(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleReorderTab(section.id, tabIdx, -1)}
                          disabled={tabIdx === 0}
                          className="text-muted-foreground hover:text-primary disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorderTab(section.id, tabIdx, 1)}
                          disabled={tabIdx === (tabsBySection[section.id]?.length ?? 0) - 1}
                          className="text-muted-foreground hover:text-primary disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTab(tab.id);
                            setEditTabTitle(tab.title);
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTab(tab.id, section.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {expandedTab === tab.id && (
                    <div className="border-t border-border p-2 space-y-1.5 bg-card/50">
                      {(contentsByTab[tab.id]?.length ?? 0) === 0 && (
                        <p className="text-[11px] text-muted-foreground text-center py-1">
                          Nenhum conteúdo
                        </p>
                      )}
                      {contentsByTab[tab.id]?.map((c, idx) => (
                        <div
                          key={c.id}
                          className="px-2 py-1 bg-background rounded"
                        >
                          {editingContent === c.id ? (
                            <div className="space-y-1.5 p-1">
                              <Input
                                value={editContentTitle}
                                onChange={(e) => setEditContentTitle(e.target.value)}
                                placeholder="Título"
                                className="h-7 text-xs"
                                autoFocus
                              />
                              <Input
                                value={editContentDesc}
                                onChange={(e) => setEditContentDesc(e.target.value)}
                                placeholder="Descrição (opcional)"
                                className="h-7 text-xs"
                              />
                              <select
                                value={editContentType}
                                onChange={(e) => setEditContentType(e.target.value as "youtube" | "pdf" | "link" | "image" | "video")}
                                className="h-7 text-xs w-full bg-background border border-input rounded-md px-2"
                              >
                                <option value="link">Link</option>
                                <option value="youtube">Link de Vídeo (YouTube/Vimeo)</option>
                                <option value="video">Vídeo MP4 (upload)</option>
                                <option value="pdf">PDF</option>
                                <option value="image">Imagem</option>
                              </select>
                              {editContentType === "pdf" || editContentType === "image" || editContentType === "video" ? (
                                <div className="space-y-1">
                                  <input
                                    ref={editFileInputRef}
                                    type="file"
                                    accept={
                                      editContentType === "pdf"
                                        ? ".pdf"
                                        : editContentType === "image"
                                        ? "image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                        : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                                    }
                                    className="text-[10px] w-full"
                                  />
                                  {c.url && (c.type === "pdf" || c.type === "image" || c.type === "video") && (
                                    <p className="text-[9px] text-muted-foreground truncate">
                                      Atual: {c.url.split("/").pop()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  value={editContentUrl}
                                  onChange={(e) => setEditContentUrl(e.target.value)}
                                  placeholder={editContentType === "youtube" ? "URL do vídeo (YouTube, Vimeo, Drive...)" : "URL do link"}
                                  className="h-7 text-xs"
                                />
                              )}
                              {editContentType === "pdf" && (
                                <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={editContentAllowDownload}
                                    onChange={(e) => setEditContentAllowDownload(e.target.checked)}
                                    className="h-3 w-3 accent-primary"
                                  />
                                  Permitir download deste PDF
                                </label>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-6 text-[10px] flex-1"
                                  onClick={() => handleSaveEditContent(c.id, tab.id, c.type)}
                                  disabled={!editContentTitle.trim() || editUploading}
                                >
                                  {editUploading ? "Enviando..." : "Salvar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[10px]"
                                  onClick={() => setEditingContent(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                          <div className="flex items-center gap-2">
                          {c.type === "youtube" ? (
                            <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                          ) : c.type === "pdf" ? (
                            <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                          ) : (
                            <File className="w-3 h-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-[11px] flex-1 truncate">{c.title}</span>
                          <div className="flex flex-col -space-y-0.5">
                            <button
                              onClick={() => handleReorderContent(tab.id, idx, -1)}
                              disabled={idx === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              title="Mover para cima"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleReorderContent(tab.id, idx, 1)}
                              disabled={idx === (contentsByTab[tab.id]?.length ?? 0) - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          {(tabsBySection[section.id]?.length ?? 0) > 1 && (
                            <select
                              value=""
                              onChange={(e) =>
                                handleMoveContent(c.id, tab.id, e.target.value, section.id)
                              }
                              className="h-6 text-[10px] rounded border border-border bg-card px-1 max-w-[110px]"
                              title="Mover para outra aba"
                            >
                              <option value="">Mover para...</option>
                              {tabsBySection[section.id]
                                ?.filter((t) => t.id !== tab.id)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.title}
                                  </option>
                                ))}
                            </select>
                          )}
                          <button
                            onClick={() => startEditContent(c)}
                            className="text-muted-foreground hover:text-primary"
                            title="Editar"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteContent(c.id, tab.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          </div>
                          )}
                        </div>
                      ))}

                      {showForm !== tab.id ? (
                        <button
                          onClick={() => setShowForm(tab.id)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-primary hover:bg-primary/5 rounded"
                        >
                          <Plus className="w-3 h-3" /> Adicionar conteúdo
                        </button>
                      ) : (
                        <div className="p-2 bg-secondary rounded space-y-1.5">
                          <div className="flex gap-1">
                             {(
                               [
                                 { type: "youtube" as const, icon: Youtube, label: "Link Vídeo" },
                                 { type: "video" as const, icon: Youtube, label: "MP4" },
                                 { type: "pdf" as const, icon: Upload, label: "PDF" },
                                 { type: "image" as const, icon: ImageIcon, label: "Imagem" },
                                 { type: "link" as const, icon: File, label: "Link" },
                               ]
                             ).map(({ type, icon: Icon, label }) => (
                              <button
                                key={type}
                                onClick={() => setContentType(type)}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-medium ${
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
                            className="h-7 text-xs"
                          />
                          <Input
                            value={contentDesc}
                            onChange={(e) => setContentDesc(e.target.value)}
                            placeholder="Descrição (opcional)"
                            className="h-7 text-xs"
                          />
                           {contentType === "pdf" || contentType === "image" || contentType === "video" ? (
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept={
                                contentType === "pdf"
                                  ? ".pdf"
                                  : contentType === "image"
                                  ? "image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                  : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                              }
                              className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-primary file:text-primary-foreground"
                            />
                          ) : (
                            <Input
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              placeholder={
                                contentType === "youtube"
                                  ? "URL do vídeo (YouTube, Vimeo, Drive, Loom...)"
                                  : "URL do link"
                              }
                              className="h-7 text-xs"
                            />
                          )}
                          {contentType === "pdf" && (
                            <label className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={contentAllowDownload}
                                onChange={(e) => setContentAllowDownload(e.target.checked)}
                                className="h-3.5 w-3.5 accent-primary"
                              />
                              Permitir que usuários baixem este PDF
                            </label>
                          )}
                          <div className="flex gap-1">
                            <Button
                              onClick={() => handleAddContent(section.id, tab.id)}
                              disabled={!contentTitle.trim() || uploading}
                              size="sm"
                              className="flex-1 h-7 text-[11px] gap-1"
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                                </>
                              ) : (
                                "Adicionar"
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetContentForm}
                              className="h-7 text-[11px]"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add new tab */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Input
                  value={newTabTitle[section.id] || ""}
                  onChange={(e) =>
                    setNewTabTitle((prev) => ({ ...prev, [section.id]: e.target.value }))
                  }
                  placeholder="Nome da nova aba (ex: Comece aqui)"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTab(section.id);
                  }}
                />
                <Button
                  onClick={() => handleAddTab(section.id)}
                  disabled={!(newTabTitle[section.id] || "").trim()}
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Aba
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminSections;