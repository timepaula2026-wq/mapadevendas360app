import { useState, useRef } from "react";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
}

interface SectionTab {
  id: string;
  section_id: string;
  title: string;
  sort_order: number | null;
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
  { id: "presenca", label: "Presença Treinamentos" },
];

const AdminSections = () => {
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<string | null>(null);
  const [tabsBySection, setTabsBySection] = useState<Record<string, SectionTab[]>>({});
  const [contentsByTab, setContentsByTab] = useState<Record<string, SectionContent[]>>({});
  const [orphansBySection, setOrphansBySection] = useState<Record<string, SectionContent[]>>({});
  const [newTabTitle, setNewTabTitle] = useState<Record<string, string>>({});
  const [editingTab, setEditingTab] = useState<string | null>(null);
  const [editTabTitle, setEditTabTitle] = useState("");

  // Form for adding content to a tab
  const [showForm, setShowForm] = useState<string | null>(null); // tabId
  const [contentTitle, setContentTitle] = useState("");
  const [contentDesc, setContentDesc] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "pdf" | "link">("youtube");
  const [contentUrl, setContentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTabs = async (sectionId: string) => {
    const { data } = await supabase
      .from("section_tabs")
      .select("*")
      .eq("section_id", sectionId)
      .order("sort_order", { ascending: true });
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
      .order("sort_order", { ascending: true });
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
  };

  const handleFileUpload = async (file: globalThis.File, sectionId: string, tabId: string) => {
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

    const { data: urlData } = supabase.storage.from("training-files").getPublicUrl(filePath);

    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      tab_id: tabId,
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
      fetchTabContents(tabId);
    }
    setUploading(false);
  };

  const handleAddContent = async (sectionId: string, tabId: string) => {
    if (!contentTitle.trim() || !user) return;

    if (contentType === "pdf" && fileInputRef.current?.files?.[0]) {
      await handleFileUpload(fileInputRef.current.files[0], sectionId, tabId);
      return;
    }

    const { error } = await supabase.from("section_contents").insert({
      section_id: sectionId,
      tab_id: tabId,
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

  const handleReorderContent = async (tabId: string, index: number, direction: -1 | 1) => {
    const list = contentsByTab[tabId];
    if (!list) return;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    const orderA = a.sort_order ?? index;
    const orderB = b.sort_order ?? target;
    // Optimistic UI swap
    const next = [...list];
    next[index] = { ...b, sort_order: orderA };
    next[target] = { ...a, sort_order: orderB };
    setContentsByTab((prev) => ({ ...prev, [tabId]: next }));
    const [r1, r2] = await Promise.all([
      supabase.from("section_contents").update({ sort_order: orderB }).eq("id", a.id),
      supabase.from("section_contents").update({ sort_order: orderA }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) {
      toast.error("Erro ao reordenar");
      fetchTabContents(tabId);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Cada seção tem abas (temas). Adicione conteúdos dentro de cada aba.
      </p>
      {SECTIONS.map((section) => (
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

              {tabsBySection[section.id]?.map((tab) => (
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
                          className="flex items-center gap-2 px-2 py-1 bg-background rounded"
                        >
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
                            onClick={() => handleDeleteContent(c.id, tab.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
                                { type: "youtube" as const, icon: Youtube, label: "YouTube" },
                                { type: "pdf" as const, icon: Upload, label: "PDF" },
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
                          {contentType === "pdf" ? (
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf"
                              className="w-full text-[11px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-primary file:text-primary-foreground"
                            />
                          ) : (
                            <Input
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              placeholder={
                                contentType === "youtube" ? "URL do YouTube" : "URL do link"
                              }
                              className="h-7 text-xs"
                            />
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