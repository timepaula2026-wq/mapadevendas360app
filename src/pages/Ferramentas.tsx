import { ArrowLeft, Wrench, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const tools = [
  { name: "WhatsApp Business", description: "Gerencie conversas com clientes" },
  { name: "Planilha de Controle", description: "Acompanhe seus resultados" },
  { name: "Gerador de Links", description: "Crie links personalizados" },
  { name: "Calculadora de Comissão", description: "Calcule seus ganhos" },
  { name: "Modelo de Propostas", description: "Templates prontos para usar" },
];

const Ferramentas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Acessos de Ferramentas</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Ferramentas essenciais para o seu dia a dia.</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {tools.map((t, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ferramentas;
