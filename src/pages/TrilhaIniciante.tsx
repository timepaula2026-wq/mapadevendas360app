import { ArrowLeft, Rocket, FileSignature, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GRID_SECTIONS } from "@/lib/sections";
import { useUserRoles } from "@/hooks/useUserRoles";
import SectionContentList from "@/components/SectionContentList";
import AgendaOnlineBlock from "@/components/AgendaOnlineBlock";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";
import { useSectionsCounts } from "@/hooks/useSectionsCounts";
import CertificateModal from "@/components/CertificateModal";
import { useAuth } from "@/hooks/useAuth";

type Section = { id: string; label: string };

const DEFAULT_SECTIONS: Section[] = DEFAULT_GRID_SECTIONS.map((s) => ({ id: s.id, label: s.label }));

const TrilhaIniciante = () => {
  const navigate = useNavigate();
  const { roles: userRoles } = useUserRoles();
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState<string>("trilha");
  const [displayName, setDisplayName] = useState<string>("Consultor(a)");
  const [globalCertOpen, setGlobalCertOpen] = useState(false);
  const [globalCertIssuedAt, setGlobalCertIssuedAt] = useState<string | undefined>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [globalCertPending, setGlobalCertPending] = useState(false);

  // Escuta sinal do SectionContentList para saber se algum visualizador
  // de conteúdo está aberto. Usamos isso para adiar o certificado global.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setViewerOpen(!!detail?.open);
    };
    window.addEventListener("trilha:viewer", handler);
    return () => window.removeEventListener("trilha:viewer", handler);
  }, []);

  const { completed, issueCertificate, hasCertificate } = useTrilhaProgress();
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { counts: sectionTotals } = useSectionsCounts(sectionIds);

  const baseLabels = useMemo(
    () => Object.fromEntries(DEFAULT_GRID_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>,
    []
  );

  // Busca o nome do consultor do profile
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.display_name) setDisplayName(data.display_name);
    })();
  }, [user?.id]);

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
        // Mantém "trilha" como ativo se estiver visível; senão usa o primeiro disponível.
        setActiveSection((curr) => {
          if (visible.find((s) => s.id === curr)) return curr;
          if (visible.find((s) => s.id === "trilha")) return "trilha";
          return visible[0].id;
        });
      }
    };
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoles.join(",")]);

  // Conta concluídos por seção (a partir do Set global de progresso e dos
  // contents.section_id já buscados via useSectionsCounts? — para isso
  // precisamos saber por section_id quantos completed o user tem).
  const completedBySection = useMemo(() => {
    // O Set "completed" só guarda IDs; o lookup section_id precisa de outra fonte.
    // Vamos expor isto fazendo uma consulta leve no momento da renderização da chip.
    return null;
  }, []);

  // Como não temos section_id agregado por content_id no client, fazemos uma
  // consulta única que já agrupa o progresso por section_id do usuário.
  const [completedPerSection, setCompletedPerSection] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("trilha_progress")
        .select("section_id")
        .eq("user_id", user.id);
      const acc: Record<string, number> = {};
      (data || []).forEach((r: { section_id: string }) => {
        acc[r.section_id] = (acc[r.section_id] || 0) + 1;
      });
      setCompletedPerSection(acc);
    })();
  }, [user?.id, completed.size]);

  // Helper: seção concluída?
  const isSectionDone = (id: string) => {
    const total = sectionTotals[id] ?? 0;
    if (total === 0) return false; // seções vazias não bloqueiam nem concluem
    return (completedPerSection[id] ?? 0) >= total;
  };

  // Bloqueio sequencial entre seções (chips do topo)
  const isSectionLocked = (id: string) => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx <= 0) return false;
    for (let i = 0; i < idx; i++) {
      const prevId = sections[i].id;
      const prevTotal = sectionTotals[prevId] ?? 0;
      if (prevTotal === 0) continue; // seção vazia não bloqueia próxima
      if ((completedPerSection[prevId] ?? 0) < prevTotal) return true;
    }
    return false;
  };

  // Emite certificado global (toda a Trilha) quando todas as seções com conteúdo estão concluídas.
  useEffect(() => {
    if (sections.length === 0) return;
    const sectionsWithContent = sections.filter((s) => (sectionTotals[s.id] ?? 0) > 0);
    if (sectionsWithContent.length === 0) return;
    const allDone = sectionsWithContent.every((s) => isSectionDone(s.id));
    if (allDone && !hasCertificate("__global__", "global", null)) {
      (async () => {
        const cert = await issueCertificate({
          sectionId: "__global__",
          scope: "global",
          scopeRef: null,
          title: "Trilha do Iniciante completa",
        });
        if (cert) {
          setGlobalCertIssuedAt(cert.issued_at);
          setGlobalCertPending(true);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedPerSection, sectionTotals, sections]);

  // Só abre o certificado global quando NÃO houver visualizador de conteúdo
  // aberto — assim ele não aparece por cima do último conteúdo da Trilha.
  // Damos também um pequeno atraso para o certificado de "seção" aparecer primeiro.
  useEffect(() => {
    if (!globalCertPending || viewerOpen || globalCertOpen) return;
    const t = setTimeout(() => {
      setGlobalCertOpen(true);
      setGlobalCertPending(false);
    }, 600);
    return () => clearTimeout(t);
  }, [globalCertPending, viewerOpen, globalCertOpen]);

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
        {/* Agenda Online no topo */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Agenda Online</h2>
          <AgendaOnlineBlock />
        </div>

        {/* Seletor de seção (chips horizontais) */}
        <div className="-mx-5 px-5 mb-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1">
            {sections.map((s) => {
              const locked = isSectionLocked(s.id);
              const done = isSectionDone(s.id);
              const total = sectionTotals[s.id] ?? 0;
              const doneCount = completedPerSection[s.id] ?? 0;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (locked) return;
                    setActiveSection(s.id);
                  }}
                  disabled={locked}
                  title={locked ? "Conclua a seção anterior para liberar" : s.label}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    locked
                      ? "bg-card text-muted-foreground/50 border-border cursor-not-allowed"
                      : activeSection === s.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:text-emerald-300"
                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {locked && <Lock className="w-3 h-3" />}
                  {done && !locked && <CheckCircle2 className="w-3 h-3" />}
                  <span>{s.label}</span>
                  {total > 0 && !locked && (
                    <span className="opacity-70">· {doneCount}/{total}</span>
                  )}
                </button>
              );
            })}
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

        <SectionContentList
          sectionId={activeSection}
          consultantName={displayName}
          sectionLabel={sections.find((s) => s.id === activeSection)?.label}
          trilhaMode
        />
      </div>

      <CertificateModal
        open={globalCertOpen}
        onClose={() => setGlobalCertOpen(false)}
        consultantName={displayName}
        achievementTitle="Trilha do Iniciante completa"
        subtitle="Você concluiu todas as seções da Trilha. Parabéns!"
        scope="global"
        issuedAt={globalCertIssuedAt}
      />
    </div>
  );
};

export default TrilhaIniciante;
