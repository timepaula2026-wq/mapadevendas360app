import { ArrowLeft, Users, UserPlus, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const members = [
  { name: "Ana Costa", role: "Consultor Prata", sales: 22 },
  { name: "Pedro Oliveira", role: "Consultor Bronze", sales: 11 },
  { name: "Julia Mendes", role: "Consultor Iniciante", sales: 3 },
];

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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Membros ({members.length})</h2>
          <button className="flex items-center gap-1 text-xs text-primary font-medium">
            <UserPlus className="w-4 h-4" /> Convidar
          </button>
        </div>
        <div className="space-y-3">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-muted-foreground">{m.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                {m.sales} vendas
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GestaoEquipe;
