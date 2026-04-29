import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DYNAMIC_ICONS } from "@/lib/iconPicker";
import { DEFAULT_GRID_SECTIONS, DEFAULT_SECTION_IDS } from "@/lib/sections";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";

interface GridItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  route?: string;
  allowedRoles?: string[];
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
  const { roles: userRoles } = useUserRoles();
  const { settings } = useAppSettings();
  const [orderedItems, setOrderedItems] = useState<GridItem[]>(DEFAULT_SECTION_IDS.map((id) => ALL_ITEMS[id]));

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, sort_order, visible, custom_label, icon_name, route, is_custom, allowed_roles")
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        const visible = (data as Array<{
          id: string; sort_order: number; visible: boolean;
          custom_label?: string | null; icon_name?: string | null;
          route?: string | null; is_custom?: boolean | null;
          allowed_roles?: string[] | null;
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
                allowedRoles: d.allowed_roles || [],
              } as GridItem;
            }
            const base = ALL_ITEMS[d.id];
            const Icon = (d.icon_name && DYNAMIC_ICONS[d.icon_name]) || base.icon;
            return { ...base, icon: Icon, label: d.custom_label || base.label, route: d.route || base.route, allowedRoles: d.allowed_roles || [] };
          });
        setOrderedItems(visible);
      }
    };
    fetchOrder();
  }, []);

  const isLocked = (item: GridItem) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return false;
    if (userRoles.includes("admin")) return false;
    return !item.allowedRoles.some((r) => userRoles.includes(r));
  };

  const handleClick = (item: GridItem) => {
    if (isLocked(item)) {
      toast.error("Você não tem permissão para acessar esta seção");
      return;
    }
    if (item.route) navigate(item.route);
  };

  if (settings.display_mode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {orderedItems.map((item) => {
          const locked = isLocked(item);
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] border border-white/10 shadow shadow-black/20 transition-all ${locked ? "opacity-60" : "hover:brightness-110 active:brightness-90"}`}
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 relative">
                <item.icon className="w-6 h-6 text-white" strokeWidth={1.6} />
                {locked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-white text-left flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {orderedItems.map((item) => {
        const locked = isLocked(item);
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="group"
          >
            <div
              className={`relative w-full aspect-square rounded-xl bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] flex flex-col items-center justify-center gap-2 sm:gap-3 shadow-lg shadow-black/20 border border-white/10 transition-all duration-200 p-3 sm:p-4 ${locked ? "opacity-60" : "group-hover:scale-105 group-hover:shadow-xl group-hover:brightness-110 group-active:scale-95 group-active:brightness-90"}`}
            >
              {locked && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <item.icon className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white shrink-0 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm" strokeWidth={1.4} />
              <span className="text-xs sm:text-sm font-semibold text-white text-center leading-tight line-clamp-2 px-1 drop-shadow-sm">
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default IconGrid;
