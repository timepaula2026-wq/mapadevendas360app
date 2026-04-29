import { ArrowLeft, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";
import CalculadoraComissao from "@/components/CalculadoraComissao";

const GestaoEquipe = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Gestão de Equipe</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Gerencie e acompanhe o desempenho do seu time.</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <button
          onClick={() => navigate("/analise")}
          className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Plataforma de Análise</p>
            <p className="text-xs text-muted-foreground">Análises e relatórios da equipe</p>
          </div>
        </button>

        <SectionContentList sectionId="equipe" />

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Calculadora de Comissão</h2>
          <CalculadoraComissao />
        </div>
      </div>
    </div>
  );
};

export default GestaoEquipe;
