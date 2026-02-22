import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Edit2, Youtube, FileText, File, Loader2, Users, BookOpen, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Training {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  user_id: string;
  created_at: string;
}

interface ContentItem {
  id: string;
  training_id: string;
  title: string;
  type: string;
  url: string | null;
  youtube_id: string | null;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  // Training form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Vendas");

  // Content form
  const [showContentForm, setShowContentForm] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState<"youtube" | "pdf" | "file">("youtube");
  const [contentUrl, setContentUrl] = useState("");
  const [trainingContents, setTrainingContents] = useState<Record<string, ContentItem[]>>({});

  const categories = ["Vendas", "Desenvolvimento", "Design", "Marketing", "Produtos", "Geral"];

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Acesso negado");
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchTrainings();
  }, [isAdmin]);

  const fetchTrainings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar treinamentos");
    else setTrainings(data || []);
    setLoading(false);
  };

  const fetchContents = async (trainingId: string) => {
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .eq("training_id", trainingId)
      .order("sort_order", { ascending: true });
    setTrainingContents((prev) => ({ ...prev, [trainingId]: data || [] }));
  };

  const handleSaveTraining = async () => {
    if (!title.trim() || !user) return;

    if (editingId) {
      const { error } = await supabase
        .from("trainings")
        .update({ title: title.trim(), description: description.trim(), category })
        .eq("id", editingId);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Treinamento atualizado!");
    } else {
      const { error } = await supabase
        .from("trainings")
        .insert({ title: title.trim(), description: description.trim(), category, user_id: user.id });
      if (error) toast.error("Erro ao criar");
      else toast.success("Treinamento criado!");
    }

    resetForm();
    fetchTrainings();
  };

  const handleDeleteTraining = async (id: string) => {
    const { error } = await supabase.from("trainings").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Excluído!");
      fetchTrainings();
    }
  };

  const handleEditTraining = (t: Training) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description || "");
    setCategory(t.category || "Geral");
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("Vendas");
  };

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleAddContent = async (trainingId: string) => {
    if (!contentTitle.trim() || !user) return;

    const item: any = {
      training_id: trainingId,
      user_id: user.id,
      title: contentTitle.trim(),
      type: contentType,
      url: contentUrl || null,
      youtube_id: contentType === "youtube" ? extractYoutubeId(contentUrl) : null,
    };

    const { error } = await supabase.from("content_items").insert(item);
    if (error) toast.error("Erro ao adicionar conteúdo");
    else {
      toast.success("Conteúdo adicionado!");
      setContentTitle("");
      setContentUrl("");
      setShowContentForm(null);
      fetchContents(trainingId);
    }
  };

  const handleDeleteContent = async (contentId: string, trainingId: string) => {
    const { error } = await supabase.from("content_items").delete().eq("id", contentId);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Conteúdo removido!");
      fetchContents(trainingId);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerenciar treinamentos e conteúdos</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <Tabs defaultValue="trainings">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="trainings" className="flex-1 gap-1">
              <BookOpen className="w-4 h-4" /> Treinamentos
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 gap-1">
              <Layers className="w-4 h-4" /> Resumo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trainings">
            {/* Add button */}
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full mb-4 gap-2">
              <Plus className="w-4 h-4" /> Novo Treinamento
            </Button>

            {/* Create/Edit Form */}
            {showForm && (
              <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">
                  {editingId ? "Editar Treinamento" : "Novo Treinamento"}
                </h3>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do treinamento"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição"
                  rows={2}
                  className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none border border-input"
                />
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        category === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveTraining} disabled={!title.trim()} className="flex-1">
                    {editingId ? "Salvar" : "Criar"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Training list */}
            <div className="space-y-3">
              {trainings.map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{t.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {t.category}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEditTraining(t)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTraining(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contents section */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Conteúdos</span>
                      <button
                        onClick={() => {
                          if (!trainingContents[t.id]) fetchContents(t.id);
                          setShowContentForm(showContentForm === t.id ? null : t.id);
                        }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>

                    {/* Content items */}
                    {trainingContents[t.id]?.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 py-1.5 text-sm">
                        {c.type === "youtube" ? <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" /> :
                         c.type === "pdf" ? <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> :
                         <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                        <span className="text-foreground text-xs truncate flex-1">{c.title}</span>
                        <button onClick={() => handleDeleteContent(c.id, t.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {!trainingContents[t.id] && (
                      <button
                        onClick={() => fetchContents(t.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Carregar conteúdos...
                      </button>
                    )}

                    {/* Add content form */}
                    {showContentForm === t.id && (
                      <div className="mt-2 p-3 bg-secondary rounded-lg space-y-2">
                        <div className="flex gap-1">
                          {[
                            { type: "youtube" as const, icon: Youtube, label: "YouTube" },
                            { type: "pdf" as const, icon: FileText, label: "PDF" },
                            { type: "file" as const, icon: File, label: "Arquivo" },
                          ].map(({ type, icon: Icon, label }) => (
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
                          placeholder="Título do conteúdo"
                          className="h-8 text-xs"
                        />
                        <Input
                          value={contentUrl}
                          onChange={(e) => setContentUrl(e.target.value)}
                          placeholder={contentType === "youtube" ? "URL do YouTube" : "URL do arquivo"}
                          className="h-8 text-xs"
                        />
                        <Button
                          onClick={() => handleAddContent(t.id)}
                          disabled={!contentTitle.trim()}
                          size="sm"
                          className="w-full text-xs"
                        >
                          Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {trainings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum treinamento cadastrado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{trainings.length}</p>
                <p className="text-xs text-muted-foreground">Treinamentos</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Layers className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(trainingContents).reduce((sum, arr) => sum + arr.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Conteúdos</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
