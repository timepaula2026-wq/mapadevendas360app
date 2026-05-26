import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowLeft, Loader2, Check, X, Trophy, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Question { id: string; type: string; question: string; options: { text: string; correct: boolean }[]; time_limit: number; points: number; }

const QuizzPlay = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("lobby");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [answered, setAnswered] = useState<Record<string, { idx: number; correct: boolean }>>({});
  const [now, setNow] = useState(Date.now());
  const joinedRef = useRef(false);

  const join = useCallback(async () => {
    if (!user || !pin || joinedRef.current) return;
    joinedRef.current = true;
    const { data: s } = await supabase.from("quiz_sessions").select("*").eq("pin", pin).neq("status", "ended").maybeSingle();
    if (!s) { toast.error("Sessão inválida"); navigate("/quizz"); return; }
    setSessionId(s.id); setStatus(s.status); setCurrentIdx(s.current_question_index); setStartedAt(s.question_started_at);
    const { data: qs } = await supabase.from("quiz_questions").select("*").eq("quiz_id", s.quiz_id).order("sort_order");
    if (qs) setQuestions(qs as unknown as Question[]);

    // Get display name from profile
    const { data: p } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const name = p?.display_name || user.email || "Anônimo";
    await supabase.from("quiz_participants").upsert(
      { session_id: s.id, user_id: user.id, display_name: name },
      { onConflict: "session_id,user_id" }
    );

    const { data: me } = await supabase.from("quiz_participants").select("score").eq("session_id", s.id).eq("user_id", user.id).maybeSingle();
    if (me) setMyScore(me.score);

    const { data: myRs } = await supabase.from("quiz_responses").select("question_id, answer, is_correct").eq("session_id", s.id).eq("user_id", user.id);
    if (myRs) {
      const map: typeof answered = {};
      myRs.forEach((r) => {
        const a = r.answer as { index?: number };
        map[r.question_id] = { idx: a?.index ?? -1, correct: r.is_correct };
      });
      setAnswered(map);
    }
  }, [user, pin, navigate]);

  useEffect(() => { join(); }, [join]);

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`play-${sessionId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quiz_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const s = payload.new as { status: string; current_question_index: number; question_started_at: string | null };
          setStatus(s.status); setCurrentIdx(s.current_question_index); setStartedAt(s.question_started_at);
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quiz_participants", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const p = payload.new as { user_id: string; score: number };
          if (p.user_id === user?.id) setMyScore(p.score);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId, user?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const currentQ = currentIdx >= 0 ? questions[currentIdx] : null;
  const startMs = startedAt ? new Date(startedAt).getTime() : 0;
  const elapsed = startMs ? (now - startMs) / 1000 : 0;
  const remaining = currentQ ? Math.max(0, currentQ.time_limit - elapsed) : 0;
  const timesUp = currentQ ? remaining <= 0 : false;
  const myAnswer = currentQ ? answered[currentQ.id] : undefined;

  const submit = async (optionIdx: number) => {
    if (!currentQ || !user || !sessionId || myAnswer || timesUp) return;
    const correct = currentQ.options[optionIdx]?.correct === true;
    const speedBonus = Math.max(0, 1 - elapsed / currentQ.time_limit);
    const pts = correct ? Math.round(currentQ.points * (0.5 + 0.5 * speedBonus)) : 0;
    setAnswered((m) => ({ ...m, [currentQ.id]: { idx: optionIdx, correct } }));
    const { error } = await supabase.from("quiz_responses").insert({
      session_id: sessionId, question_id: currentQ.id, user_id: user.id,
      answer: { index: optionIdx }, is_correct: correct, points: pts,
    });
    if (error) { toast.error("Erro ao responder"); return; }
    if (pts > 0) {
      const newScore = myScore + pts;
      setMyScore(newScore);
      await supabase.from("quiz_participants").update({ score: newScore }).eq("session_id", sessionId).eq("user_id", user.id);
    }
  };

  if (!sessionId) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/quizz")} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">PIN {pin}</h1>
          <p className="text-xs text-muted-foreground">{myScore} pontos</p>
        </div>
      </header>

      <div className="p-4 max-w-xl mx-auto space-y-4">
        {status === "lobby" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">Aguardando o host iniciar…</p>
          </div>
        )}

        {status === "active" && currentQ && (
          <>
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(remaining / currentQ.time_limit) * 100}%` }} />
              </div>
              <span className="text-sm font-bold text-foreground tabular-nums">{Math.ceil(remaining)}s</span>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-xs text-muted-foreground mb-2">Pergunta {currentIdx + 1} de {questions.length}</p>
              <h2 className="text-xl font-bold text-foreground mb-4">{currentQ.question}</h2>
              <div className="space-y-2">
                {currentQ.options.map((o, i) => {
                  const isMine = myAnswer?.idx === i;
                  const showResult = myAnswer || timesUp;
                  return (
                    <button
                      key={i}
                      onClick={() => submit(i)}
                      disabled={!!myAnswer || timesUp}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        showResult && o.correct ? "border-green-500 bg-green-500/10" :
                        showResult && isMine && !o.correct ? "border-red-500 bg-red-500/10" :
                        isMine ? "border-primary bg-primary/10" :
                        "border-border bg-secondary hover:border-primary/50"
                      } ${myAnswer || timesUp ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="flex-1 text-sm font-medium text-foreground">{o.text}</span>
                      {showResult && o.correct && <Check className="w-5 h-5 text-green-500" />}
                      {showResult && isMine && !o.correct && <X className="w-5 h-5 text-red-500" />}
                    </button>
                  );
                })}
              </div>
              {myAnswer && (
                <p className={`text-sm font-semibold mt-4 text-center ${myAnswer.correct ? "text-green-500" : "text-red-500"}`}>
                  {myAnswer.correct ? "✅ Resposta correta!" : "❌ Resposta errada"}
                </p>
              )}
            </div>
          </>
        )}

        {status === "ended" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-1">Quiz encerrado!</h2>
            <p className="text-sm text-muted-foreground mb-4">Sua pontuação final</p>
            <p className="text-5xl font-black text-primary">{myScore}</p>
            <Button onClick={() => navigate("/quizz")} variant="outline" className="mt-6">Voltar</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzPlay;