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
  trilha: { id: "trilha", label: "Trilha do Iniciante", icon: Rocket, color: "from-amber-500 to-amber-700", route: "/trilha" },
  vendas: { id: "vendas", label: "Central de Vendas & CRM", icon: BarChart3, color: "from-amber-600 to-amber-800", route: "/vendas" },
  ferramentas: { id: "ferramentas", label: "Acessos de Ferramentas", icon: Wrench, color: "from-zinc-600 to-zinc-800", route: "/ferramentas" },
  treinamentos: { id: "treinamentos", label: "Treinamentos", icon: GraduationCap, color: "from-zinc-600 to-zinc-800", route: "/trainings" },
  carreira: { id: "carreira", label: "Plano de Carreira", icon: Trophy, color: "from-amber-500 to-amber-700", route: "/carreira" },
  apresentacao: { id: "apresentacao", label: "Apresentação de Produtos", icon: FileText, color: "from-zinc-600 to-zinc-800", route: "/apresentacao" },
  sorteios: { id: "sorteios", label: "Sorteios & Comunicados", icon: Gift, color: "from-amber-600 to-amber-800", route: "/sorteios" },
  credito: { id: "credito", label: "Liberação de Crédito", icon: CreditCard, color: "from-zinc-600 to-zinc-800", route: "/credito" },
  jornada: { id: "jornada", label: "Jornada Impacto", icon: MapPin, color: "from-amber-500 to-amber-700", route: "/jornada" },
  equipe: { id: "equipe", label: "Gestão de Equipe", icon: Users, color: "from-zinc-600 to-zinc-800", route: "/equipe" },
  cliente: { id: "cliente", label: "Área do Cliente", icon: Globe, color: "from-amber-600 to-amber-800", route: "/cliente" },
  analise: { id: "analise", label: "Plataforma de Análise", icon: BookOpen, color: "from-zinc-600 to-zinc-800", route: "/analise" },
  loja: { id: "loja", label: "Loja", icon: ShoppingCart, color: "from-amber-500 to-amber-700", route: "/loja" },
  locacao: { id: "locacao", label: "Locação de Materiais", icon: CalendarDays, color: "from-zinc-600 to-zinc-800", route: "/locacao" },
  presenca: { id: "presenca", label: "Presença Treinamentos", icon: ClipboardCheck, color: "from-amber-600 to-amber-800", route: "/presenca-treinamentos" },
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
            className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${item.color} flex flex-col items-center justify-center gap-1 shadow-md border border-white/5 group-hover:scale-[1.03] transition-transform p-1.5`}
          >
            <item.icon className="w-5 h-5 text-white/90 shrink-0" strokeWidth={1.5} />
            <span className="text-[8px] font-medium text-white/80 text-center leading-tight line-clamp-2 px-0.5">
              {item.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default IconGrid;
