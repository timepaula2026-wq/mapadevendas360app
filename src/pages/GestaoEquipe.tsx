import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";

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

      <div className="px-5 mt-6">
        <SectionContentList sectionId="equipe" />
      </div>
    </div>
  );
};

export default GestaoEquipe;
