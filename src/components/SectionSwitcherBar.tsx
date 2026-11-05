import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GRID_SECTIONS } from "@/lib/sections";
import { useUserRoles } from "@/hooks/useUserRoles";

// Menu de troca rápida entre as seções da tela inicial — mostrado no topo
// de cada seção pra não precisar voltar pra home pra trocar de aba.
type Section = { id: string; label: string; route: string };

const BASE_LABELS = Object.fromEntries(DEFAULT_GRID_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const BASE_ROUTES = Object.fromEntries(DEFAULT_GRID_SECTIONS.map((s) => [s.id, s.route])) as Record<string, string>;

const SectionSwitcherBar = ({ activeId }: { activeId: string }) => {
  const navigate = useNavigate();
  const { roles: userRoles, loading: rolesLoading } = useUserRoles();
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (rolesLoading) return;
    const isAdmin = userRoles.includes("admin");
    (async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, sort_order, visible, custom_label, is_custom, allowed_roles, route")
        .order("sort_order", { ascending: true });
      if (!data) return;
      const visible = (data as Array<{
        id: string; visible: boolean; custom_label?: string | null;
        is_custom?: boolean | null; allowed_roles?: string[] | null; route?: string | null;
      }>)
        .filter((d) => d.visible)
        .filter((d) => {
          const allowed = d.allowed_roles || [];
          if (allowed.length === 0 || isAdmin) return true;
          return userRoles.some((r) => allowed.includes(r));
        })
        .map((d) => ({
          id: d.id,
          label: d.custom_label || BASE_LABELS[d.id] || d.id,
          route: d.route || BASE_ROUTES[d.id] || `/c/${d.id}`,
        }))
        .filter((s) => !!s.route);
      setSections(visible);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolesLoading, userRoles.join(",")]);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pb-1 mb-4">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => {
            if (s.id !== activeId) navigate(s.route);
          }}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeId === s.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default SectionSwitcherBar;
