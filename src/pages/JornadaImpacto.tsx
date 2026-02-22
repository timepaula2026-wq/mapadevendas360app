import { ArrowLeft, MapPin, Flag, CircleDot } from "lucide-react";
import { useNavigate } from "react-router-dom";

const milestones = [
  { title: "Primeira venda realizada", done: true },
  { title: "10 clientes cadastrados", done: true },
  { title: "Meta mensal atingida", done: false },
  { title: "Indicação de novo consultor", done: false },
  { title: "Líder de equipe", done: false },
];

const JornadaImpacto = () => {
  const navigate = useNavigate();
  const doneCount = milestones.filter((m) => m.done).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-red-600 to-red-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Jornada Impacto</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Acompanhe seus marcos e conquistas.</p>
        <p className="text-white/60 text-xs mt-2">{doneCount} de {milestones.length} marcos alcançados</p>
      </div>

      <div className="px-5 mt-6">
        <div className="relative pl-6 space-y-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
          {milestones.map((m, i) => (
            <div key={i} className="relative flex items-center gap-4">
              <div className="absolute -left-6">
                {m.done ? (
                  <Flag className="w-5 h-5 text-primary" />
                ) : (
                  <CircleDot className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className={`p-4 bg-card border rounded-xl flex-1 ${m.done ? "border-primary/30" : "border-border"}`}>
                <p className={`text-sm font-medium ${m.done ? "text-foreground" : "text-muted-foreground"}`}>{m.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JornadaImpacto;
