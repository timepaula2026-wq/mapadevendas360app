import { Youtube, FileText, ExternalLink, Loader2, File } from "lucide-react";
import { useSectionContents } from "@/hooks/useSectionContents";

interface SectionContentListProps {
  sectionId: string;
}

const SectionContentList = ({ sectionId }: SectionContentListProps) => {
  const { contents, loading } = useSectionContents(sectionId);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (contents.length === 0) return null;

  return (
    <div className="space-y-3">
      {contents.map((c) => (
        <a
          key={c.id}
          href={c.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            c.type === "youtube" ? "bg-red-500/10" : c.type === "pdf" ? "bg-blue-500/10" : "bg-muted"
          }`}>
            {c.type === "youtube" ? (
              <Youtube className="w-5 h-5 text-red-500" />
            ) : c.type === "pdf" ? (
              <FileText className="w-5 h-5 text-blue-500" />
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
        </a>
      ))}
    </div>
  );
};

export default SectionContentList;
