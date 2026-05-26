import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Loader2, Save, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Option { text: string; correct: boolean }
interface Question {
  id?: string;
  type: "multiple" | "true_false";
  question: string;
  options: Option[];
  time_limit: number;
  points: number;
  sort_order: number;
}

const QuizzEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [{ data: q }, { data: qs }] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).maybeSingle(),
        supabase.from("quiz_questions").select("*").eq("quiz_id", id).order("sort_order"),
      ]);
      if (q) { setTitle(q.title); setDescription(q.description || ""); }
      if (qs) setQuestions(qs.map((row) => ({
        id: row.id,
        type: (row.type as "multiple" | "true_false") || "multiple",
        question: row.question,
        options: (row.options as unknown as Option[]) || [],
        time_limit: row.time_limit,
        points: row.points,
        sort_order: row.sort_order,
      })));
      setLoading(false);
    })();
  }, [id]);

  const addQuestion = (type: "multiple" | "true_false") => {
    setQuestions((prev) => [...prev, {
      type,
      question: "",
      options: type === "true_false"
        ? [{ text: "Verdadeiro", correct: true }, { text: "Falso", correct: false }]
        : [{ text: "", correct: true }, { text: "", correct: false }, { text: "", correct: false }, { text: "", correct: false }],
      time_limit: 20,
      points: 100,
      sort_order: prev.length,
    }]);
  };

  const updateQ = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };
  const updateOpt = (qIdx: number, oIdx: number, patch: Partial<Option>) => {
    setQuestions((prev) => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => j === oIdx ? { ...o, ...patch } : o) }
      : q));
  };
  const setCorrect = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => i === qIdx
      ? { ...q, options: q.options.map((o, j) => ({ ...o, correct: j === oIdx })) }
      : q));
  };
  const removeQ = (idx: number) => setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, sort_order: i })));

  const save = async () => {
    if (!id) return;
    setSaving(true);
    const { error: e1 } = await supabase.from("quizzes").update({ title: title.trim(), description: description.trim() }).eq("id", id);
    if (e1) { toast.error("Erro ao salvar"); setSaving(false); return; }

    // replace all questions
    await supabase.from("quiz_questions").delete().eq("quiz_id", id);
    if (questions.length) {
      const rows = questions.map((q, i) => ({
        quiz_id: id, type: q.type, question: q.question, options: q.options as unknown as object,
        time_limit: q.time_limit, points: q.points, sort_order: i,
      }));
      const { error: e2 } = await supabase.from("quiz_questions").insert(rows);
      if (e2) { toast.error("Erro ao salvar perguntas"); setSaving(false); return; }
    }
    setSaving(false);
    toast.success("Salvo!");
    navigate("/quizz");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/quizz")} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold text-foreground flex-1">Editar Quiz</h1>
        <Button onClick={save} disabled={saving || !title.trim()} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </Button>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">#{qi + 1} · {q.type === "true_false" ? "V/F" : "Múltipla"}</span>
              <button onClick={() => removeQ(qi)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
            <Input value={q.question} onChange={(e) => updateQ(qi, { question: e.target.value })} placeholder="Pergunta" />
            <div className="space-y-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrect(qi, oi)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${o.correct ? "bg-green-500 border-green-500" : "border-border"}`}
                    title="Marcar como correta"
                  >
                    {o.correct && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <Input
                    value={o.text}
                    onChange={(e) => updateOpt(qi, oi, { text: e.target.value })}
                    placeholder={`Opção ${oi + 1}`}
                    disabled={q.type === "true_false"}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 text-xs">
              <label className="flex items-center gap-1 text-muted-foreground">
                Tempo (s)
                <Input type="number" min={5} max={120} value={q.time_limit} onChange={(e) => updateQ(qi, { time_limit: parseInt(e.target.value) || 20 })} className="w-16 h-8" />
              </label>
              <label className="flex items-center gap-1 text-muted-foreground">
                Pontos
                <Input type="number" min={0} max={1000} value={q.points} onChange={(e) => updateQ(qi, { points: parseInt(e.target.value) || 100 })} className="w-20 h-8" />
              </label>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => addQuestion("multiple")}><Plus className="w-4 h-4" /> Múltipla escolha</Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => addQuestion("true_false")}><Plus className="w-4 h-4" /> Verdadeiro/Falso</Button>
        </div>
      </div>
    </div>
  );
};

export default QuizzEdit;