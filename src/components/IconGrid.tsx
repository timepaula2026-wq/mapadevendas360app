import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface GridItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route?: string;
}

const ALL_ITEMS: Record<string, GridItem> = {
  trilha: { id: "trilha", label: "Trilha do Iniciante", icon: Rocket, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/trilha" },
  vendas: { id: "vendas", label: "Central de Vendas & CRM", icon: BarChart3, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/vendas" },
  ferramentas: { id: "ferramentas", label: "Acessos de Ferramentas", icon: Wrench, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/ferramentas" },
  treinamentos: { id: "treinamentos", label: "Treinamentos", icon: GraduationCap, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/trainings" },
  carreira: { id: "carreira", label: "Plano de Carreira", icon: Trophy, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/carreira" },
  apresentacao: { id: "apresentacao", label: "Apresentação de Produtos", icon: FileText, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/apresentacao" },
  sorteios: { id: "sorteios", label: "Sorteios & Comunicados", icon: Gift, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/sorteios" },
  credito: { id: "credito", label: "Liberação de Crédito", icon: CreditCard, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/credito" },
  jornada: { id: "jornada", label: "Jornada Impacto", icon: MapPin, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/jornada" },
  equipe: { id: "equipe", label: "Gestão de Equipe", icon: Users, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/equipe" },
  cliente: { id: "cliente", label: "Área do Cliente", icon: Globe, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/cliente" },
  analise: { id: "analise", label: "Plataforma de Análise", icon: BookOpen, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/analise" },
  loja: { id: "loja", label: "Loja", icon: ShoppingCart, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/loja" },
  locacao: { id: "locacao", label: "Locação de Materiais", icon: CalendarDays, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/locacao" },
  presenca: { id: "presenca", label: "Presença Treinamentos", icon: ClipboardCheck, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/presenca-treinamentos" },
};

// Default order fallback
const DEFAULT_ORDER = ["trilha", "vendas", "ferramentas", "treinamentos", "carreira", "apresentacao", "sorteios", "credito", "jornada", "equipe", "cliente", "analise", "loja", "locacao", "presenca"];

const IconGrid = () => {
  const navigate = useNavigate();
  const [orderedItems, setOrderedItems] = useState<GridItem[]>(DEFAULT_ORDER.map((id) => ALL_ITEMS[id]));

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, sort_order, visible")
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        const visible = (data as { id: string; sort_order: number; visible: boolean }[])
          .filter((d) => d.visible && ALL_ITEMS[d.id])
          .map((d) => ALL_ITEMS[d.id]);
        setOrderedItems(visible);
      }
    };
    fetchOrder();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-2">
      {orderedItems.map((item) => (
        <button
          key={item.id}
          onClick={() => item.route && navigate(item.route)}
          className="group"
        >
          <div
            className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${item.color} flex flex-col items-center justify-center gap-1 shadow-md border border-white/5 transition-all duration-200 p-1.5 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:brightness-110 group-active:scale-95 group-active:brightness-90`}
          >
            <item.icon className="w-6 h-6 text-white/90 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
            <span className="text-[9px] font-semibold text-white/85 text-center leading-tight line-clamp-2 px-0.5 transition-colors group-hover:text-white">
              {item.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default IconGrid;
