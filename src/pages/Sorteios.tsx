import { ArrowLeft, Gift, Bell, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  { title: "Sorteio iPhone 16", date: "15 Mar 2026", type: "sorteio", status: "Aberto" },
  { title: "Nova tabela de comissões", date: "10 Mar 2026", type: "comunicado", status: "Novo" },
  { title: "Confraternização da equipe", date: "20 Mar 2026", type: "comunicado", status: "Lido" },
  { title: "Sorteio Kit Premium", date: "30 Mar 2026", type: "sorteio", status: "Em breve" },
];

const Sorteios = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-amber-600 to-amber-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Sorteios & Comunicados</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Fique por dentro das novidades e promoções.</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === "sorteio" ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
              {item.type === "sorteio" ? <Gift className="w-5 h-5 text-amber-500" /> : <Bell className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "Novo" || item.status === "Aberto" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sorteios;
