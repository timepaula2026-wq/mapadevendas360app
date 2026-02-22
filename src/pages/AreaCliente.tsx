import { ArrowLeft, Globe, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AreaCliente = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Área do Cliente</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Portal exclusivo para seus clientes.</p>
      </div>

      <div className="px-5 mt-6">
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.<br />Adicione seus primeiros clientes!</p>
        </div>
      </div>
    </div>
  );
};

export default AreaCliente;
