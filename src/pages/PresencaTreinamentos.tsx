import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PresencaTreinamentos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pt-10 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">
          <span className="text-gradient-gold">Presença Treinamentos</span>
        </h1>
      </header>
      <div className="flex-1 px-2 pb-24">
        <iframe
          src="https://train-track-log.lovable.app"
          className="w-full h-full min-h-[70vh] rounded-xl border border-border"
          title="Presença Treinamentos"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
};

export default PresencaTreinamentos;
