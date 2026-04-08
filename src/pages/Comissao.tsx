import { ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Comissao = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-r from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] text-white p-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <DollarSign className="w-6 h-6" />
        <h1 className="text-lg font-bold">Comissão</h1>
      </div>
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Comissões</h2>
        <p className="text-muted-foreground">Em breve você poderá acompanhar suas comissões aqui.</p>
      </div>
    </div>
  );
};

export default Comissao;
