import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DYNAMIC_ICONS } from "@/lib/iconPicker";
import { DEFAULT_GRID_SECTIONS, DEFAULT_SECTION_IDS } from "@/lib/sections";

interface GridItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route?: string;
}

const DEFAULT_COLOR = "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]";

const ALL_ITEMS: Record<string, GridItem> = Object.fromEntries(
  DEFAULT_GRID_SECTIONS.map((section) => [
    section.id,
    {
      id: section.id,
      label: section.label,
      icon: DYNAMIC_ICONS[section.iconName] || DYNAMIC_ICONS.Sparkles,
      color: DEFAULT_COLOR,
      route: section.route,
    },
  ])
) as Record<string, GridItem>;

const IconGrid = () => {
  const navigate = useNavigate();
  const [orderedItems, setOrderedItems] = useState<GridItem[]>(DEFAULT_SECTION_IDS.map((id) => ALL_ITEMS[id]));

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, sort_order, visible, custom_label, icon_name, route, is_custom")
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        const visible = (data as Array<{
          id: string; sort_order: number; visible: boolean;
          custom_label?: string | null; icon_name?: string | null;
          route?: string | null; is_custom?: boolean | null;
        }>)
          .filter((d) => d.visible && (ALL_ITEMS[d.id] || d.is_custom))
          .map((d) => {
            if (d.is_custom) {
              const Icon = (d.icon_name && DYNAMIC_ICONS[d.icon_name]) || DYNAMIC_ICONS.Sparkles;
              return {
                id: d.id,
                label: d.custom_label || d.id,
                icon: Icon,
                color: "from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)]",
                route: d.route || `/c/${d.id}`,
              } as GridItem;
            }
            const base = ALL_ITEMS[d.id];
            const Icon = (d.icon_name && DYNAMIC_ICONS[d.icon_name]) || base.icon;
            return { ...base, icon: Icon, label: d.custom_label || base.label, route: d.route || base.route };
          });
        setOrderedItems(visible);
      }
    };
    fetchOrder();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {orderedItems.map((item) => (
        <button
          key={item.id}
          onClick={() => item.route && navigate(item.route)}
          className="group"
        >
          <div
            className="w-full aspect-square rounded-xl bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] flex flex-col items-center justify-center gap-3 shadow-lg shadow-black/20 border border-white/10 transition-all duration-200 p-4 group-hover:scale-105 group-hover:shadow-xl group-hover:brightness-110 group-active:scale-95 group-active:brightness-90"
          >
            <item.icon className="w-14 h-14 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm" strokeWidth={1.4} />
            <span className="text-sm font-semibold text-white text-center leading-tight line-clamp-2 px-1 drop-shadow-sm">
              {item.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default IconGrid;
