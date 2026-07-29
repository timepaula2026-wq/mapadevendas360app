import { Play, FileText, File, CheckCircle2, Circle } from "lucide-react";
import { ContentItem } from "@/types/training";

const typeIcons = {
  youtube: Play,
  pdf: FileText,
  file: File,
};

const typeLabels = {
  youtube: "Vídeo",
  pdf: "PDF",
  file: "Arquivo",
};

interface ContentCardProps {
  content: ContentItem;
  onToggle: () => void;
  onRemove: () => void;
  onOpen?: () => void;
}

const ContentCard = ({ content, onToggle, onRemove, onOpen }: ContentCardProps) => {
  const Icon = typeIcons[content.type];
  const CompletionIcon = content.completed ? CheckCircle2 : Circle;
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      className={`glass-card rounded-lg p-4 flex items-center gap-4 animate-fade-in group ${onOpen ? "cursor-pointer" : ""}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        className="shrink-0"
      >
        <CompletionIcon
          className={`w-5 h-5 transition-colors ${
            content.completed ? "text-primary fill-primary" : "text-muted-foreground"
          }`}
        />
      </button>

      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${content.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {content.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {typeLabels[content.type]}
          {content.duration && ` · ${content.duration}`}
          {content.fileSize && ` · ${content.fileSize}`}
        </p>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        Remover
      </button>
    </div>
  );
};

export default ContentCard;
