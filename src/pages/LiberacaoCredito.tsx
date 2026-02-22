import { ArrowLeft, CreditCard, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const requests = [
  { client: "João Silva", value: "R$ 5.000", status: "aprovado", date: "20/02/2026" },
  { client: "Maria Santos", value: "R$ 12.000", status: "pendente", date: "21/02/2026" },
  { client: "Carlos Lima", value: "R$ 3.500", status: "negado", date: "19/02/2026" },
];

const statusConfig = {
  aprovado: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Aprovado" },
  pendente: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Pendente" },
  negado: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Negado" },
};

const LiberacaoCredito = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Liberação de Crédito</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Acompanhe as solicitações de crédito dos clientes.</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {requests.map((r, i) => {
          const cfg = statusConfig[r.status as keyof typeof statusConfig];
          return (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{r.client}</p>
                <p className="text-xs text-muted-foreground">{r.value} • {r.date}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiberacaoCredito;
