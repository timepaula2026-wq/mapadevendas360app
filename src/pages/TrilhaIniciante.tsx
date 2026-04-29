import { ArrowLeft, Rocket, FileSignature } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GRID_SECTIONS } from "@/lib/sections";
import { useUserRoles } from "@/hooks/useUserRoles";
import SectionContentList from "@/components/SectionContentList";
import CalculadoraComissao from "@/components/CalculadoraComissao";
import AgendaOnlineBlock from "@/components/AgendaOnlineBlock";

type Section = { id: string; label: string };

const DEFAULT_SECTIONS: Section[] = DEFAULT_GRID_SECTIONS.map((s) => ({ id: s.id, label: s.label }));

const TrilhaIniciante = () => {
  const navigate = useNavigate();
  const { roles: userRoles } = useUserRoles();
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState<string>("trilha");

  const baseLabels = useMemo(
    () => Object.fromEntries(DEFAULT_GRID_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>,
    []
  );

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, sort_order, visible, custom_label, is_custom, allowed_roles")
        .order("sort_order", { ascending: true });

      if (!data || data.length === 0) return;

      const isAdmin = userRoles.includes("admin");
      const visible = (data as Array<{
        id: string; visible: boolean; custom_label?: string | null;
        is_custom?: boolean | null; allowed_roles?: string[] | null;
      }>)
        .filter((d) => d.visible && (baseLabels[d.id] || d.is_custom))
        .filter((d) => {
          const allowed = d.allowed_roles || [];
          if (allowed.length === 0 || isAdmin) return true;
          return userRoles.some((r) => allowed.includes(r));
        })
        .map((d) => ({
          id: d.id,
          label: d.custom_label || baseLabels[d.id] || d.id,
        }));

      if (visible.length > 0) {
        setSections(visible);
        if (!visible.find((s) => s.id === activeSection)) {
          setActiveSection(visible[0].id);
        }
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoles.join(",")]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-10 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">Voltar</span>
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="w-5 h-5 text-white" />
          <h1 className="text-base font-bold text-white">Trilha do Iniciante</h1>
        </div>
        <p className="text-white/70 text-xs">Comece sua jornada de sucesso em vendas.</p>
      </div>

      <div className="px-5 mt-6">
        {/* Seletor de seção (chips horizontais) */}
        <div className="-mx-5 px-5 mb-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Termo de Correspondente */}
        {activeSection === "trilha" && (
          <div
            onClick={() => navigate("/termo-correspondente")}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card border-primary/30 cursor-pointer hover:bg-accent/50 transition-colors mb-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Termo de Correspondente Comercial</p>
              <p className="text-xs text-muted-foreground">Leia e assine o termo para iniciar</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </div>
        )}

        <SectionContentList sectionId={activeSection} />

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Calculadora de Comissão</h2>
          <CalculadoraComissao />
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Agenda Online</h2>
          <AgendaOnlineBlock />
        </div>
      </div>
    </div>
  );
};

export default TrilhaIniciante;
