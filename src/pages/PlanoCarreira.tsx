import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Star, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";
import AgendaOnlineBlock from "@/components/AgendaOnlineBlock";
import { supabase } from "@/integrations/supabase/client";
import { CAREER_LEVELS } from "@/lib/careerLevels";

const PlanoCarreira = () => {
  const navigate = useNavigate();
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("category")
        .eq("user_id", userId)
        .maybeSingle();
      setCurrentLevel((data as any)?.category || null);
      setLoading(false);
    };
    load();
  }, []);

  const levels = CAREER_LEVELS.map((l) => ({
    name: l.label,
    requirement: l.requirement,
    current: l.value === currentLevel,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Plano de Carreira</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Evolua dentro da empresa e conquiste novos níveis.</p>
      </div>

      <div className="px-5 mt-6">
        {/* Agenda Online no topo */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Agenda Online</h2>
          <AgendaOnlineBlock />
        </div>
      </div>

      <div className="px-5 mt-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {!currentLevel && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                Seu nível ainda não foi definido pelo administrador. Fale com sua liderança para liberar seu nível de carreira.
              </p>
            )}
            {levels.map((l, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${l.current ? "bg-primary/10 border-primary" : "bg-card border-border"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${l.current ? "bg-primary" : "bg-muted"}`}>
                  <Star className={`w-5 h-5 ${l.current ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${l.current ? "text-primary" : "text-foreground"}`}>{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.requirement}</p>
                </div>
                {l.current && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Atual</span>}
                {!l.current && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conteúdos</h2>
        <SectionContentList sectionId="carreira" />
      </div>
    </div>
  );
};

export default PlanoCarreira;
