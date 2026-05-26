import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Loader2, Users, Play, SkipForward, Square, Trophy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Question { id: string; type: string; question: string; options: { text: string; correct: boolean }[]; time_limit: number; points: number; sort_order: number; }
interface Participant { id: string; user_id: string; display_name: string; score: number; }
interface Response { id: string; user_id: string; question_id: string; is_correct: boolean; points: number; answer: unknown; }

const QuizzHost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<{ id: string; pin: string; status: string; current_question_index: number; quiz_id: string; question_started_at: string | null } | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const { data: s } = await supabase.from("quiz_sessions").select("*").eq("id", id).maybeSingle();
    if (!s) { toast.error("Sessão não encontrada"); navigate("/quizz"); return; }
    setSession(s as typeof session extends infer T ? T : never);
    const [{ data: q }, { data: qs }, { data: ps }, { data: rs }] = await Promise.all([
      supabase.from("quizzes").select("title").eq("id", s.quiz_id).maybeSingle(),
      supabase.from("quiz_questions").select("*").eq("quiz_id", s.quiz_id).order("sort_order"),
      supabase.from("quiz_participants").select("*").eq("session_id", id),
      supabase.from("quiz_responses").select("*").eq("session_id", id),
    ]);
    if (q) setQuizTitle(q.title);
    if (qs) setQuestions(qs as unknown as Question[]);
    if (ps) setParticipants(ps as Participant[]);
    if (rs) setResponses(rs as unknown as Response[]);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`host-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_participants", filter: `session_id=eq.${id}` },
        () => supabase.from("quiz_participants").select("*").eq("session_id", id).then(({ data }) => data && setParticipants(data as Participant[])))
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_responses", filter: `session_id=eq.${id}` },
        () => supabase.from("quiz_responses").select("*").eq("session_id", id).then(({ data }) => data && setResponses(data as unknown as Response[])))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const updateSession = async (patch: Partial<NonNullable<typeof session>>) => {
    if (!id) return;
    const { data, error } = await supabase.from("quiz_sessions").update(patch).eq("id", id).select().maybeSingle();
    if (error) { toast.error("Erro: " + error.message); return; }
    if (data) setSession(data as typeof session);
  };

  const start = () => updateSession({ status: "active", current_question_index: 0, question_started_at: new Date().toISOString() });
  const next = () => {
    if (!session) return;
    const ni = session.current_question_index + 1;
    if (ni >= questions.length) {
      updateSession({ status: "ended", current_question_index: ni });
    } else {
      updateSession({ current_question_index: ni, question_started_at: new Date().toISOString() });
    }
  };
  const end = () => updateSession({ status: "ended" });

  if (loading || !session) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const currentQ = session.current_question_index >= 0 ? questions[session.current_question_index] : null;
  const currentResponses = currentQ ? responses.filter((r) => r.question_id === currentQ.id) : [];
  const ranking = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/quizz")} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{quizTitle}</h1>
          <p className="text-xs text-muted-foreground">Sessão ao vivo</p>
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* LOBBY */}
        {session.status === "lobby" && (
          <>
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-3xl p-8 text-center">
              <p className="text-sm uppercase tracking-widest opacity-80">PIN da sessão</p>
              <p className="text-6xl font-black tracking-widest my-3">{session.pin}</p>
              <p className="text-xs opacity-80">Entrem em <strong>Quizz → Entrar em um quiz</strong></p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Participantes ({participants.length})</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <span key={p.id} className="px-3 py-1 rounded-full bg-secondary text-foreground text-xs">{p.display_name}</span>
                ))}
                {!participants.length && <p className="text-xs text-muted-foreground">Aguardando participantes…</p>}
              </div>
            </div>
            <Button onClick={start} disabled={!questions.length} className="w-full gap-2 h-12 text-base">
              <Play className="w-5 h-5" /> Iniciar quiz
            </Button>
          </>
        )}

        {/* ACTIVE */}
        {session.status === "active" && currentQ && (
          <>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs text-muted-foreground mb-2">Pergunta {session.current_question_index + 1} de {questions.length}</p>
              <h2 className="text-2xl font-bold text-foreground mb-4">{currentQ.question}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQ.options.map((o, i) => {
                  const count = currentResponses.filter((r) => {
                    const a = r.answer as { index?: number };
                    return a?.index === i;
                  }).length;
                  const pct = currentResponses.length ? Math.round((count / currentResponses.length) * 100) : 0;
                  return (
                    <div key={i} className={`relative rounded-xl p-3 border ${o.correct ? "border-green-500/50 bg-green-500/5" : "border-border bg-secondary"}`}>
                      <div className="absolute inset-0 bg-primary/10 rounded-xl" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{o.text}</span>
                        <span className="text-xs font-bold text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{currentResponses.length} de {participants.length} responderam</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={next} className="flex-1 gap-2">
                <SkipForward className="w-4 h-4" /> {session.current_question_index + 1 >= questions.length ? "Finalizar" : "Próxima"}
              </Button>
              <Button variant="outline" onClick={end} className="gap-2"><Square className="w-4 h-4" /> Encerrar</Button>
            </div>
          </>
        )}

        {/* ENDED */}
        {session.status === "ended" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-foreground">Ranking final</h2>
            </div>
            <div className="space-y-2">
              {ranking.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-foreground">{p.display_name}</span>
                  <span className="text-sm font-bold text-primary">{p.score} pts</span>
                </div>
              ))}
              {!ranking.length && <p className="text-sm text-muted-foreground text-center py-4">Sem participantes</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzHost;