import {
  GraduationCap,
  Rocket,
  Wrench,
  Trophy,
  FileText,
  Gift,
  CreditCard,
  MapPin,
  Users,
  Globe,
  BarChart3,
  BookOpen,
  ShoppingCart,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GridItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route?: string;
}

const gridItems: GridItem[] = [
  { id: "trilha", label: "Trilha do Iniciante", icon: Rocket, color: "from-red-600 to-red-800", route: "/trilha" },
  { id: "vendas", label: "Central de Vendas & CRM", icon: BarChart3, color: "from-red-700 to-red-900", route: "/vendas" },
  { id: "ferramentas", label: "Acessos de Ferramentas", icon: Wrench, color: "from-slate-600 to-slate-800", route: "/ferramentas" },
  { id: "treinamentos", label: "Treinamentos", icon: GraduationCap, color: "from-slate-600 to-slate-800", route: "/trainings" },
  { id: "carreira", label: "Plano de Carreira", icon: Trophy, color: "from-red-600 to-red-800", route: "/carreira" },
  { id: "apresentacao", label: "Apresentação de Produtos", icon: FileText, color: "from-slate-600 to-slate-800", route: "/apresentacao" },
  { id: "sorteios", label: "Sorteios & Comunicados", icon: Gift, color: "from-amber-600 to-amber-800", route: "/sorteios" },
  { id: "credito", label: "Liberação de Crédito", icon: CreditCard, color: "from-slate-600 to-slate-800", route: "/credito" },
  { id: "jornada", label: "Jornada Impacto", icon: MapPin, color: "from-red-600 to-red-800", route: "/jornada" },
  { id: "equipe", label: "Gestão de Equipe", icon: Users, color: "from-slate-600 to-slate-800", route: "/equipe" },
  { id: "cliente", label: "Área do Cliente", icon: Globe, color: "from-emerald-600 to-emerald-800", route: "/cliente" },
  { id: "analise", label: "Plataforma de Análise", icon: BookOpen, color: "from-slate-600 to-slate-800", route: "/analise" },
  { id: "loja", label: "Loja", icon: ShoppingCart, color: "from-emerald-600 to-emerald-800", route: "/loja" },
  { id: "locacao", label: "Locação de Materiais", icon: CalendarDays, color: "from-amber-600 to-amber-800", route: "/locacao" },
  { id: "presenca", label: "Presença Treinamentos", icon: ClipboardCheck, color: "from-blue-600 to-blue-800", route: "/presenca-treinamentos" },
];

const IconGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {gridItems.map((item) => (
        <button
          key={item.id}
          onClick={() => item.route && navigate(item.route)}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-full aspect-square rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg border border-white/5 group-hover:scale-105 transition-transform`}
          >
            <item.icon className="w-7 h-7 text-white/90" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight line-clamp-2">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default IconGrid;
