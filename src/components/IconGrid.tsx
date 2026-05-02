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
    <>
      <style>{`
        .icon-grid-responsive {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          --icon-size: 28px;
          --label-size: 0.7rem;
          --label-leading: 1.1;
        }
        @media (min-width: 640px) {
          .icon-grid-responsive {
            gap: 14px;
            grid-template-columns: repeat(${settings.grid_cols_tablet}, minmax(0, 1fr));
            --icon-size: ${settings.icon_size_tablet}px;
            --label-size: 0.8rem;
            --label-leading: 1.15;
          }
        }
        @media (min-width: 1024px) {
          .icon-grid-responsive {
            gap: 16px;
            grid-template-columns: repeat(${settings.grid_cols_desktop}, minmax(0, 1fr));
            --icon-size: ${settings.icon_size_desktop}px;
            --label-size: 0.875rem;
            --label-leading: 1.2;
          }
        }
      `}</style>
      <div className="icon-grid-responsive">
      {orderedItems.map((item) => {
        const locked = isLocked(item);
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="group min-h-[72px]"
          >
            <div
              className={`bento-card relative w-full aspect-square flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl ${locked ? "opacity-60" : "group-hover:-translate-y-0.5 group-active:scale-[0.97]"}`}
            >
              {locked && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center z-10">
                  <Lock className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex items-center justify-center">
                <item.icon
                  className="text-primary shrink-0 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={1.5}
                  style={{ width: "var(--icon-size)", height: "var(--icon-size)" }}
                />
              </div>
              <span
                className="font-medium text-foreground/90 text-center line-clamp-2 break-words w-full"
                style={{
                  fontSize: "var(--label-size)",
                  lineHeight: "var(--label-leading)",
                  letterSpacing: "-0.01em",
                }}
              >
                {item.label}
              </span>
            </div>
          </button>
        );
      })}
      </div>
    </>
  );
};

export default IconGrid;
