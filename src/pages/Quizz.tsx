import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Sparkles, Play, Trash2, Edit2, Loader2, ListChecks, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

const Quizz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [joinPin, setJoinPin] = useState("");

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quizzes").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar quizzes");
    else setQuizzes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuizzes(); }, []);

  const createBlank = async () => {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("quizzes")
      .insert({ title: newTitle.trim(), user_id: user.id, description: "" })
      .select().single();
    setCreating(false);
    if (error || !data) { toast.error("Erro ao criar"); return; }
    setNewTitle("");
    navigate(`/quizz/edit/${data.id}`);
  };

  const generateWithAI = async () => {
    if (!user || !aiTopic.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { topic: aiTopic.trim(), count: aiCount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const questions = data?.questions || [];
      if (!questions.length) throw new Error("Nenhuma pergunta gerada");

      const { data: quiz, error: qErr } = await supabase
        .from("quizzes")
        .insert({ title: aiTopic.trim(), user_id: user.id, description: `Gerado por IA · ${questions.length} perguntas` })
        .select().single();
      if (qErr || !quiz) throw qErr;

      const rows = questions.map((q: { type: string; question: string; options: { text: string; correct: boolean }[] }, i: number) => ({
        quiz_id: quiz.id,
        type: q.type === "true_false" ? "true_false" : "multiple",
        question: q.question,
        options: q.options,
        time_limit: 20,
        points: 100,
        sort_order: i,
      }));
      const { error: insErr } = await supabase.from("quiz_questions").insert(rows);
      if (insErr) throw insErr;

      toast.success(`Quiz criado com ${questions.length} perguntas!`);
      setAiTopic("");
      navigate(`/quizz/edit/${quiz.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar");
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este quiz?")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetchQuizzes(); }
  };

  const startSession = async (quizId: string) => {
    if (!user) return;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({ quiz_id: quizId, host_id: user.id, pin, status: "lobby" })
      .select().single();
    if (error || !data) { toast.error("Erro ao iniciar sessão"); return; }
    navigate(`/quizz/host/${data.id}`);
  };

  const joinByPin = async () => {
    const pin = joinPin.trim();
    if (pin.length < 4) return;
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("id, status")
      .eq("pin", pin)
      .neq("status", "ended")
      .maybeSingle();
    if (error || !data) { toast.error("PIN inválido ou sessão encerrada"); return; }
    navigate(`/quizz/play/${pin}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Quizz</h1>
          <p className="text-xs text-muted-foreground">Crie, aplique e participe de quizzes ao vivo</p>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Entrar com PIN */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Entrar em um quiz</h2>
          </div>
          <div className="flex gap-2">
            <Input value={joinPin} onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Digite o PIN" inputMode="numeric" />
            <Button onClick={joinByPin} disabled={joinPin.length < 4}>Entrar</Button>
          </div>
        </div>

        {/* IA */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Gerar quiz com IA</h2>
          </div>
          <Input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Tema (ex: técnicas de venda consultiva)" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Nº perguntas</label>
            <Input type="number" min={1} max={15} value={aiCount} onChange={(e) => setAiCount(parseInt(e.target.value) || 5)} className="w-20" />
            <Button onClick={generateWithAI} disabled={!aiTopic.trim() || generating} className="ml-auto gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar
            </Button>
          </div>
        </div>

        {/* Manual */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Criar quiz em branco</h2>
          </div>
          <div className="flex gap-2">
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do quiz" />
            <Button onClick={createBlank} disabled={!newTitle.trim() || creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground px-1">Meus quizzes</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum quiz ainda</p>
            </div>
          ) : (
            quizzes.map((q) => (
              <div key={q.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{q.title}</h3>
                  {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
                </div>
                {q.user_id === user?.id && (
                  <>
                    <button onClick={() => navigate(`/quizz/edit/${q.id}`)} className="p-2 text-muted-foreground hover:text-foreground" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(q.id)} className="p-2 text-muted-foreground hover:text-destructive" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <Button size="sm" onClick={() => startSession(q.id)} className="gap-1">
                  <Play className="w-3.5 h-3.5" /> Iniciar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Quizz;