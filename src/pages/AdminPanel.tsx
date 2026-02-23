import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Trash2, Edit2, Youtube, FileText, File, Loader2, BookOpen, Layers, Users, Upload, CheckCircle, XCircle, Grid3X3, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminSections from "@/components/AdminSections";
import AdminProducts from "@/components/AdminProducts";

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

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  approved: boolean;
  created_at: string;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Users
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const categories = ["Vendas", "Desenvolvimento", "Design", "Marketing", "Produtos", "Geral"];

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Acesso negado");
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTrainings();
      fetchUsers();
    }
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar usuários");
    else setUsers((data as UserProfile[]) || []);
    setUsersLoading(false);
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
    else { toast.success("Excluído!"); fetchTrainings(); }
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

  const handleFileUpload = async (file: globalThis.File, trainingId: string) => {
    if (!user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${trainingId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("training-files")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("training-files")
      .getPublicUrl(filePath);

    const { error } = await supabase.from("content_items").insert({
      training_id: trainingId,
      user_id: user.id,
      title: contentTitle.trim() || file.name,
      type: "pdf",
      url: urlData.publicUrl,
    });

    if (error) toast.error("Erro ao salvar conteúdo");
    else {
      toast.success("PDF enviado com sucesso!");
      setContentTitle("");
      setShowContentForm(null);
      fetchContents(trainingId);
    }
    setUploading(false);
  };

  const handleAddContent = async (trainingId: string) => {
    if (!contentTitle.trim() || !user) return;

    if (contentType === "pdf" && fileInputRef.current?.files?.[0]) {
      await handleFileUpload(fileInputRef.current.files[0], trainingId);
      return;
    }

    const { error } = await supabase.from("content_items").insert({
      training_id: trainingId,
      user_id: user.id,
      title: contentTitle.trim(),
      type: contentType,
      url: contentUrl || null,
      youtube_id: contentType === "youtube" ? extractYoutubeId(contentUrl) : null,
    });
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
    else { toast.success("Conteúdo removido!"); fetchContents(trainingId); }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approved: approve })
      .eq("user_id", userId);
    if (error) toast.error("Erro ao atualizar usuário");
    else {
      toast.success(approve ? "Usuário aprovado!" : "Acesso revogado!");
      fetchUsers();
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
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-xs text-muted-foreground">Gerenciar treinamentos, conteúdos e usuários</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <Tabs defaultValue="trainings">
          <TabsList className="w-full mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="trainings" className="flex-1 gap-1">
              <BookOpen className="w-4 h-4" /> Treinamentos
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex-1 gap-1">
              <Grid3X3 className="w-4 h-4" /> Seções
            </TabsTrigger>
             <TabsTrigger value="users" className="flex-1 gap-1">
               <Users className="w-4 h-4" /> Usuários
             </TabsTrigger>
             <TabsTrigger value="products" className="flex-1 gap-1">
               <ShoppingCart className="w-4 h-4" /> Loja
             </TabsTrigger>
             <TabsTrigger value="stats" className="flex-1 gap-1">
               <Layers className="w-4 h-4" /> Resumo
             </TabsTrigger>
          </TabsList>

          {/* ===== TRAININGS TAB ===== */}
          <TabsContent value="trainings">
            <Button onClick={() => { resetForm(); setShowForm(true); }} className="w-full mb-4 gap-2">
              <Plus className="w-4 h-4" /> Novo Treinamento
            </Button>

            {showForm && (
              <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-sm text-foreground">
                  {editingId ? "Editar Treinamento" : "Novo Treinamento"}
                </h3>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do treinamento" />
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
                      <button onClick={() => fetchContents(t.id)} className="text-xs text-muted-foreground hover:text-foreground">
                        Carregar conteúdos...
                      </button>
                    )}

                    {showContentForm === t.id && (
                      <div className="mt-2 p-3 bg-secondary rounded-lg space-y-2">
                        <div className="flex gap-1">
                          {([
                            { type: "youtube" as const, icon: Youtube, label: "YouTube" },
                            { type: "pdf" as const, icon: Upload, label: "PDF" },
                            { type: "file" as const, icon: File, label: "Link" },
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
                          placeholder="Título do conteúdo"
                          className="h-8 text-xs"
                        />
                        {contentType === "pdf" ? (
                          <div className="space-y-1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf"
                              className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                            <p className="text-[10px] text-muted-foreground">Selecione um arquivo PDF para upload</p>
                          </div>
                        ) : (
                          <Input
                            value={contentUrl}
                            onChange={(e) => setContentUrl(e.target.value)}
                            placeholder={contentType === "youtube" ? "URL do YouTube" : "URL do arquivo"}
                            className="h-8 text-xs"
                          />
                        )}
                        <Button
                          onClick={() => handleAddContent(t.id)}
                          disabled={!contentTitle.trim() || uploading}
                          size="sm"
                          className="w-full text-xs gap-1"
                        >
                          {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</> : "Adicionar"}
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

          {/* ===== SECTIONS TAB ===== */}
          <TabsContent value="sections">
            <AdminSections />
          </TabsContent>

          {/* ===== USERS TAB ===== */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Aprove ou revogue o acesso dos usuários cadastrados.
                </p>
                {users.map((u) => (
                  <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {u.display_name || "Sem nome"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Cadastro: {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {u.approved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium mr-1">
                          Aprovado
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-medium mr-1">
                          Pendente
                        </span>
                      )}
                      {!u.approved ? (
                        <button
                          onClick={() => handleApproveUser(u.user_id, true)}
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                          title="Aprovar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveUser(u.user_id, false)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                          title="Revogar acesso"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Nenhum usuário cadastrado</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ===== PRODUCTS TAB ===== */}
          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>

          {/* ===== STATS TAB ===== */}
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
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.approved).length}
                </p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
