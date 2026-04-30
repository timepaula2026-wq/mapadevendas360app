import { useEffect, useState } from "react";
import {
  Youtube,
  FileText,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  PlayCircle,
  ChevronsDownUp,
  ChevronsUpDown,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useSectionContents, type SectionContent } from "@/hooks/useSectionContents";
import ContentViewerModal from "@/components/ContentViewerModal";
import CertificateModal from "@/components/CertificateModal";
import { useTrilhaProgress } from "@/hooks/useTrilhaProgress";

interface SectionContentListProps {
  sectionId: string;
  /** Nome do consultor exibido no certificado. */
  consultantName?: string;
  /** Rótulo amigável da seção (para o certificado de seção). */
  sectionLabel?: string;
  /** Quando true, ativa a Trilha: progresso, bloqueio sequencial e certificados. */
  trilhaMode?: boolean;
}

type RowState = "done" | "current" | "locked" | "free";

const ContentRow = ({
  c,
  onOpen,
  state = "free",
}: {
  c: SectionContent;
  onOpen: (v: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    youtubeId: string | null;
    allowDownload: boolean;
  }) => void;
  state?: RowState;
}) => {
  const isLocked = state === "locked";
  const isDone = state === "done";
  const isNext = state === "current";
  return (
    <button
      onClick={() => {
        if (isLocked) return;
        onOpen({
          id: c.id,
          title: c.title,
          type: c.type,
          url: c.url,
          youtubeId: c.youtube_id,
          allowDownload: !!c.allow_download,
        });
      }}
      disabled={isLocked}
      aria-disabled={isLocked}
      className={`w-full flex items-center gap-4 p-4 bg-card border rounded-xl text-left transition-colors ${
        isLocked
          ? "border-border opacity-50 cursor-not-allowed"
          : isDone
          ? "border-emerald-500/30 hover:border-emerald-500/60"
          : isNext
          ? "border-primary/60 ring-1 ring-primary/30 hover:border-primary"
          : "border-border hover:border-primary/30"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          c.type === "youtube"
            ? "bg-red-500/10"
            : c.type === "video"
            ? "bg-purple-500/10"
            : c.type === "pdf"
            ? "bg-blue-500/10"
            : c.type === "image"
            ? "bg-emerald-500/10 overflow-hidden"
            : "bg-muted"
        }`}
      >
        {c.type === "youtube" ? (
          <Youtube className="w-5 h-5 text-red-500" />
        ) : c.type === "video" ? (
          <PlayCircle className="w-5 h-5 text-purple-500" />
        ) : c.type === "pdf" ? (
          <FileText className="w-5 h-5 text-blue-500" />
        ) : c.type === "image" ? (
          c.url ? (
            <img src={c.url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-emerald-500" />
          )
        ) : (
          <ExternalLink className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
        {c.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>
        )}
      </div>
      {isDone ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      ) : isLocked ? (
        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      ) : isNext ? (
        <ArrowRight className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
      ) : null}
      {c.type === "youtube" && c.youtube_id && (
        <div className="w-20 h-12 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={`https://img.youtube.com/vi/${c.youtube_id}/mqdefault.jpg`}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </button>
  );
};

const SectionContentList = ({
  sectionId,
  consultantName = "Consultor(a)",
  sectionLabel,
  trilhaMode = false,
}: SectionContentListProps) => {
  const { contents, tabs, loading } = useSectionContents(sectionId);
  const [viewer, setViewer] = useState<{
    id: string;
    title: string;
    type: string;
    url: string | null;
    youtubeId: string | null;
    allowDownload: boolean;
  } | null>(null);
  const [openTab, setOpenTab] = useState<string | null>(null);
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});
  const { completed, markCompleted, issueCertificate, hasCertificate } = useTrilhaProgress();
  const [certModal, setCertModal] = useState<{
    title: string;
    subtitle?: string;
    scope: "tab" | "section" | "global";
    issuedAt?: string;
  } | null>(null);

  const orphanContents = contents.filter((c) => !c.tab_id && !c.parent_id);
  const childrenByParent: Record<string, SectionContent[]> = {};
  contents.forEach((c) => {
    if (c.parent_id) {
      (childrenByParent[c.parent_id] ||= []).push(c);
    }
  });

  // Lista linear: pai vem antes dos filhos.
  const buildSequence = (rootList: SectionContent[]): string[] => {
    const seq: string[] = [];
    rootList.forEach((c) => {
      seq.push(c.id);
      (childrenByParent[c.id] || []).forEach((k) => seq.push(k.id));
    });
    return seq;
  };

  const stateForSequence = (seq: string[], idx: number): RowState => {
    if (!trilhaMode) return "free";
    const id = seq[idx];
    if (completed.has(id)) return "done";
    for (let i = 0; i < idx; i++) {
      if (!completed.has(seq[i])) return "locked";
    }
    return "current";
  };

  // Emite certificados automáticos ao completar abas/seção
  useEffect(() => {
    if (!trilhaMode || contents.length === 0) return;

    tabs.forEach(async (t) => {
      const ids = contents.filter((c) => c.tab_id === t.id).map((c) => c.id);
      if (ids.length === 0) return;
      const allDone = ids.every((id) => completed.has(id));
      if (allDone && !hasCertificate(sectionId, "tab", t.id)) {
        const cert = await issueCertificate({
          sectionId,
          scope: "tab",
          scopeRef: t.id,
          title: `${sectionLabel || sectionId} — ${t.title}`,
        });
        if (cert) {
          setCertModal({
            title: t.title,
            subtitle: sectionLabel,
            scope: "tab",
            issuedAt: cert.issued_at,
          });
        }
      }
    });

    const allIds = contents.map((c) => c.id);
    const allDone = allIds.length > 0 && allIds.every((id) => completed.has(id));
    if (allDone && !hasCertificate(sectionId, "section", null)) {
      (async () => {
        const cert = await issueCertificate({
          sectionId,
          scope: "section",
          scopeRef: null,
          title: sectionLabel || sectionId,
        });
        if (cert) {
          setCertModal({
            title: sectionLabel || sectionId,
            subtitle: "Você concluiu todos os conteúdos desta seção",
            scope: "section",
            issuedAt: cert.issued_at,
          });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, contents, tabs, trilhaMode, sectionId, sectionLabel]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (contents.length === 0 && tabs.length === 0) return null;

  const renderParentWithChildren = (c: SectionContent, sequence: string[]) => {
    const kids = childrenByParent[c.id] || [];
    const isOpen = !!openParents[c.id];
    const parentIdx = sequence.indexOf(c.id);
    const parentState = stateForSequence(sequence, parentIdx);
    if (kids.length === 0) {
      return <ContentRow key={c.id} c={c} onOpen={setViewer} state={parentState} />;
    }
    return (
      <div key={c.id} className="space-y-2">
        <div className="flex items-stretch gap-2">
          <div className="flex-1">
            <ContentRow c={c} onOpen={setViewer} state={parentState} />
          </div>
          <button
            onClick={() => setOpenParents((p) => ({ ...p, [c.id]: !isOpen }))}
            className="px-2 rounded-xl bg-card border border-border hover:border-primary/30 flex items-center justify-center"
            aria-label="Ver sub-conteúdos"
            title={`${kids.length} sub-conteúdo(s)`}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
        {isOpen && (
          <div className="ml-6 pl-3 border-l-2 border-primary/20 space-y-2">
            {kids.map((k) => {
              const kIdx = sequence.indexOf(k.id);
              const kState = stateForSequence(sequence, kIdx);
              return <ContentRow key={k.id} c={k} onOpen={setViewer} state={kState} />;
            })}
          </div>
        )}
      </div>
    );
  };

  // Progresso geral da seção
  const totalAll = contents.length;
  const doneAll = contents.filter((c) => completed.has(c.id)).length;
  const pctAll = totalAll === 0 ? 0 : Math.round((doneAll / totalAll) * 100);

  return (
    <>
      {trilhaMode && totalAll > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              Progresso: {doneAll} de {totalAll} concluídos
            </span>
            <span className="text-xs text-primary font-semibold">{pctAll}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[hsl(348,70%,50%)] transition-all duration-500"
              style={{ width: `${pctAll}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tabs.map((t, tabIdx) => {
          const tabContents = contents.filter((c) => c.tab_id === t.id && !c.parent_id);
          const allTabIds = contents.filter((c) => c.tab_id === t.id).map((c) => c.id);
          const tabDone = allTabIds.length > 0 && allTabIds.every((id) => completed.has(id));
          const tabDoneCount = allTabIds.filter((id) => completed.has(id)).length;
          const isOpen = openTab === t.id;
          const sequence = buildSequence(tabContents);

          // Bloqueio sequencial entre abas
          let tabLocked = false;
          if (trilhaMode && tabIdx > 0) {
            for (let i = 0; i < tabIdx; i++) {
              const prevIds = contents.filter((c) => c.tab_id === tabs[i].id).map((c) => c.id);
              if (prevIds.length > 0 && !prevIds.every((id) => completed.has(id))) {
                tabLocked = true;
                break;
              }
            }
          }

          return (
            <div
              key={t.id}
              className={`bg-card border rounded-xl overflow-hidden ${
                tabLocked
                  ? "border-border opacity-60"
                  : tabDone
                  ? "border-emerald-500/30"
                  : "border-border"
              }`}
            >
              <button
                onClick={() => {
                  if (tabLocked) return;
                  setOpenTab(isOpen ? null : t.id);
                }}
                disabled={tabLocked}
                className={`w-full flex items-center justify-between p-4 transition-colors ${
                  tabLocked ? "cursor-not-allowed" : "hover:bg-secondary/40"
                }`}
              >
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {tabLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  {tabDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {t.title}
                </span>
                <div className="flex items-center gap-2">
                  {trilhaMode && allTabIds.length > 0 && !tabLocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {tabDoneCount}/{allTabIds.length}
                    </span>
                  )}
                  {tabContents.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {tabContents.length}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              {isOpen && !tabLocked && (
                <div className="border-t border-border p-3 space-y-2">
                  {(() => {
                    const parentsWithKids = tabContents.filter(
                      (c) => (childrenByParent[c.id]?.length ?? 0) > 0
                    );
                    if (parentsWithKids.length === 0) return null;
                    const allOpen = parentsWithKids.every((p) => openParents[p.id]);
                    return (
                      <div className="flex justify-end gap-2 -mt-1 mb-1">
                        <button
                          onClick={() =>
                            setOpenParents((prev) => {
                              const next = { ...prev };
                              parentsWithKids.forEach((p) => (next[p.id] = true));
                              return next;
                            })
                          }
                          disabled={allOpen}
                          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent"
                          title="Expandir todos os sub-conteúdos"
                        >
                          <ChevronsUpDown className="w-3.5 h-3.5" /> Expandir todos
                        </button>
                        <button
                          onClick={() =>
                            setOpenParents((prev) => {
                              const next = { ...prev };
                              parentsWithKids.forEach((p) => (next[p.id] = false));
                              return next;
                            })
                          }
                          disabled={parentsWithKids.every((p) => !openParents[p.id])}
                          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-40 disabled:hover:bg-transparent"
                          title="Recolher todos os sub-conteúdos"
                        >
                          <ChevronsDownUp className="w-3.5 h-3.5" /> Recolher todos
                        </button>
                      </div>
                    );
                  })()}
                  {tabContents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhum conteúdo nesta aba
                    </p>
                  ) : (
                    tabContents.map((c) => renderParentWithChildren(c, sequence))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {(() => {
          const sequence = buildSequence(orphanContents);
          return orphanContents.map((c) => renderParentWithChildren(c, sequence));
        })()}
      </div>

      {viewer && (
        <ContentViewerModal
          open={!!viewer}
          onClose={() => setViewer(null)}
          title={viewer.title}
          type={viewer.type}
          url={viewer.url}
          youtubeId={viewer.youtubeId}
          allowDownload={viewer.allowDownload}
          onOpened={() => {
            if (trilhaMode) markCompleted(viewer.id, sectionId);
          }}
        />
      )}

      {certModal && (
        <CertificateModal
          open={!!certModal}
          onClose={() => setCertModal(null)}
          consultantName={consultantName}
          achievementTitle={certModal.title}
          subtitle={certModal.subtitle}
          scope={certModal.scope}
          issuedAt={certModal.issuedAt}
        />
      )}
    </>
  );
};

export default SectionContentList;
