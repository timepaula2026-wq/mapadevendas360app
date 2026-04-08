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
  Briefcase,
  CalendarDays,
  MessageCircleHeart,
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
  administrativo: { id: "administrativo", label: "Gestão de Performance 360", icon: Briefcase, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/administrativo" },
  agenda: { id: "agenda", label: "Agenda Online", icon: CalendarDays, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/agenda" },
  paula: { id: "paula", label: "Fale com a Paula", icon: MessageCircleHeart, color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]", route: "/fale-com-paula" },
};

const DEFAULT_ORDER = ["trilha", "vendas", "ferramentas", "treinamentos", "carreira", "apresentacao", "sorteios", "credito", "jornada", "equipe", "cliente", "administrativo", "agenda", "paula"];

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
    <div className="grid grid-cols-4 gap-4">
      {orderedItems.map((item) => (
        <button
          key={item.id}
          onClick={() => item.route && navigate(item.route)}
          className="group"
        >
          <div
            className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${item.color} flex flex-col items-center justify-center gap-2.5 shadow-lg shadow-black/20 border border-white/10 transition-all duration-200 p-3 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:brightness-110 group-active:scale-95 group-active:brightness-90`}
          >
            <item.icon className="w-9 h-9 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm" strokeWidth={1.5} />
            <span className="text-[11px] font-bold text-white/90 text-center leading-tight line-clamp-2 px-1 transition-colors group-hover:text-white drop-shadow-sm">
              {item.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default IconGrid;
