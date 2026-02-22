import { ArrowLeft, BookOpen, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PlataformaAnalise = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Plataforma de Análise</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Relatórios e análises detalhadas de performance.</p>
      </div>

      <div className="px-5 mt-6">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Dados insuficientes para gerar relatórios.<br />Continue registrando suas atividades!</p>
        </div>
      </div>
    </div>
  );
};

export default PlataformaAnalise;
