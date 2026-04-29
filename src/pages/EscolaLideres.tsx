import { ArrowLeft, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";
import AgendaOnlineBlock from "@/components/AgendaOnlineBlock";
import BottomNav from "@/components/BottomNav";

const EscolaLideres = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <School className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Escola de Líderes</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Conteúdos e formação para líderes.</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        <SectionContentList sectionId="lideres" />

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Agenda Online</h2>
          <AgendaOnlineBlock />
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default EscolaLideres;
