import { ArrowLeft, Rocket, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";

const TrilhaIniciante = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <Rocket className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Trilha do Iniciante</h1>
        </div>
        <p className="text-white/70 text-sm">Comece sua jornada de sucesso em vendas.</p>
      </div>

      <div className="px-5 mt-6">
        {/* Termo de Correspondente */}
        <div
          onClick={() => navigate("/termo-correspondente")}
          className="flex items-center gap-4 p-4 rounded-xl border bg-card border-primary/30 cursor-pointer hover:bg-accent/50 transition-colors mb-4"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Termo de Correspondente Comercial</p>
            <p className="text-xs text-muted-foreground">Leia e assine o termo para iniciar</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
        </div>

        <SectionContentList sectionId="trilha" />
      </div>
    </div>
  );
};

export default TrilhaIniciante;
