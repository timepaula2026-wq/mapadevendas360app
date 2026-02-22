import { useState } from "react";
import { X, Youtube, FileText, File } from "lucide-react";
import { ContentItem } from "@/hooks/useTrainings";

interface AddContentModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (content: Omit<ContentItem, "id">) => void;
}

type ContentType = "youtube" | "pdf" | "file";

const typeOptions: { type: ContentType; label: string; icon: React.ElementType }[] = [
  { type: "youtube", label: "YouTube", icon: Youtube },
  { type: "pdf", label: "PDF", icon: FileText },
  { type: "file", label: "Arquivo", icon: File },
];

const AddContentModal = ({ open, onClose, onAdd }: AddContentModalProps) => {
  const [selectedType, setSelectedType] = useState<ContentType>("youtube");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  if (!open) return null;

  const extractYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : undefined;
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const content: Omit<ContentItem, "id"> = {
      type: selectedType,
      title: title.trim(),
      completed: false,
    };
    if (selectedType === "youtube") {
      content.youtubeId = extractYoutubeId(url);
      content.url = url;
    }
    onAdd(content);
    setTitle("");
    setUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Adicionar Conteúdo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-5">
          {typeOptions.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedType === type
                  ? "gradient-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1.5 block">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome do conteúdo"
            className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* URL for YouTube */}
        {selectedType === "youtube" && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-1.5 block">URL do YouTube</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {selectedType !== "youtube" && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-1.5 block">Arquivo</label>
            <div className="w-full bg-secondary rounded-lg px-4 py-8 text-center border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer">
              <p className="text-sm text-muted-foreground">Toque para selecionar um arquivo</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full gradient-gold text-primary-foreground font-semibold py-3 rounded-lg transition-opacity disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

export default AddContentModal;
