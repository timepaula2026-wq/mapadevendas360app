import { ArrowLeft, Rocket, PlayCircle, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";

const modules = [
  { title: "Boas-vindas ao time", duration: "5 min", completed: true },
  { title: "Como funciona o processo de vendas", duration: "12 min", completed: true },
  { title: "Conhecendo os produtos", duration: "18 min", completed: false },
  { title: "Primeiro contato com o cliente", duration: "10 min", completed: false },
  { title: "Técnicas de abordagem", duration: "15 min", locked: true },
  { title: "Fechamento de vendas", duration: "20 min", locked: true },
];

const TrilhaIniciante = () => {
  const navigate = useNavigate();
  const completedCount = modules.filter((m) => m.completed).length;
  const progress = Math.round((completedCount / modules.length) * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Trilha do Iniciante</h1>
        </div>
        <p className="text-white/70 text-sm mb-4">Comece sua jornada de sucesso em vendas.</p>
        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-white/60 text-xs mt-1 block">{progress}% concluído</span>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {modules.map((mod, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${mod.locked ? "bg-muted/30 border-border opacity-50" : "bg-card border-border"}`}>
            <div className="flex-shrink-0">
              {mod.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : mod.locked ? <Lock className="w-6 h-6 text-muted-foreground" /> : <PlayCircle className="w-6 h-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{mod.title}</p>
              <p className="text-xs text-muted-foreground">{mod.duration}</p>
            </div>
            <span className="text-xs text-muted-foreground">Módulo {i + 1}</span>
          </div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conteúdos adicionais</h2>
        <SectionContentList sectionId="trilha" />
      </div>
    </div>
  );
};

export default TrilhaIniciante;
