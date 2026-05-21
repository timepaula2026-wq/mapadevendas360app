import { ArrowLeft, ShoppingCart, CalendarDays, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  { label: "Loja", icon: ShoppingCart, route: "/loja", desc: "Produtos e pedidos" },
  { label: "Locação de Materiais", icon: CalendarDays, route: "/locacao", desc: "Agendar e gerenciar locações" },
];

const Administrativo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Administrativo</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Gerencie a loja e locação de materiais.</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {items.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] flex items-center justify-center shrink-0">
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Administrativo;
