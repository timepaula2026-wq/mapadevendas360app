import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Target, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";

const stats = [
  { label: "Vendas do Mês", value: "R$ 0", icon: DollarSign, color: "text-emerald-500" },
  { label: "Meta Mensal", value: "R$ 0", icon: Target, color: "text-primary" },
  { label: "Clientes Ativos", value: "0", icon: Users, color: "text-blue-500" },
  { label: "Taxa de Conversão", value: "0%", icon: TrendingUp, color: "text-amber-500" },
];

const CentralVendas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-red-700 to-red-900 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Central de Vendas & CRM</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Gerencie seus clientes e acompanhe suas metas.</p>
      </div>

      <div className="px-5 mt-6 grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2">
            <s.icon className={`w-6 h-6 ${s.color}`} />
            <span className="text-lg font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground text-center">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conteúdos</h2>
        <SectionContentList sectionId="vendas" />
      </div>
    </div>
  );
};

export default CentralVendas;
