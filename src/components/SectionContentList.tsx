import { useState } from "react";
import { Youtube, FileText, ExternalLink, Loader2, ChevronRight, ChevronDown, Image as ImageIcon, PlayCircle } from "lucide-react";
import { useSectionContents, type SectionContent } from "@/hooks/useSectionContents";
import ContentViewerModal from "@/components/ContentViewerModal";

interface SectionContentListProps {
  sectionId: string;
}

const ContentRow = ({
  c,
  onOpen,
}: {
  c: SectionContent;
  onOpen: (v: { title: string; type: string; url: string | null; youtubeId: string | null; allowDownload: boolean }) => void;
}) => (
  <button
    onClick={() =>
      onOpen({
        title: c.title,
        type: c.type,
        url: c.url,
        youtubeId: c.youtube_id,
        allowDownload: !!c.allow_download,
      })
    }
    className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors text-left"
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

const SectionContentList = ({ sectionId }: SectionContentListProps) => {
  const { contents, tabs, loading } = useSectionContents(sectionId);
  const [viewer, setViewer] = useState<{ title: string; type: string; url: string | null; youtubeId: string | null; allowDownload: boolean } | null>(null);
  const [openTab, setOpenTab] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (contents.length === 0 && tabs.length === 0) return null;

  const orphanContents = contents.filter((c) => !c.tab_id);

  return (
    <>
      <div className="space-y-3">
        {tabs.map((t) => {
          const tabContents = contents.filter((c) => c.tab_id === t.id);
          const isOpen = openTab === t.id;
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <button
                onClick={() => setOpenTab(isOpen ? null : t.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/40 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{t.title}</span>
                <div className="flex items-center gap-2">
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
              {isOpen && (
                <div className="border-t border-border p-3 space-y-2">
                  {tabContents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhum conteúdo nesta aba
                    </p>
                  ) : (
                    tabContents.map((c) => <ContentRow key={c.id} c={c} onOpen={setViewer} />)
                  )}
                </div>
              )}
            </div>
          );
        })}

        {orphanContents.map((c) => (
          <ContentRow key={c.id} c={c} onOpen={setViewer} />
        ))}
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
        />
      )}
    </>
  );
};

export default SectionContentList;
