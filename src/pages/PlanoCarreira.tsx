import { ArrowLeft, Trophy, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";
import AgendaOnlineBlock from "@/components/AgendaOnlineBlock";

const levels = [
  { name: "Consultor Iniciante", requirement: "0 - 5 vendas", current: true },
  { name: "Consultor Bronze", requirement: "6 - 15 vendas", current: false },
  { name: "Consultor Prata", requirement: "16 - 30 vendas", current: false },
  { name: "Consultor Ouro", requirement: "31 - 50 vendas", current: false },
  { name: "Consultor Diamante", requirement: "51+ vendas", current: false },
];

const PlanoCarreira = () => {
  const navigate = useNavigate();

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
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conteúdos</h2>
        <SectionContentList sectionId="carreira" />
      </div>
    </div>
  );
};

export default PlanoCarreira;
