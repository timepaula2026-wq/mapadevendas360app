import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useTrainings, type ContentItem } from "@/hooks/useTrainings";
import ContentCard from "@/components/ContentCard";
import AddContentModal from "@/components/AddContentModal";
import ContentViewerModal from "@/components/ContentViewerModal";

const getViewerType = (content: ContentItem) => {
  const cleanUrl = (content.url || "").split(/[?#]/)[0].toLowerCase();
  if (content.type === "pdf" || cleanUrl.endsWith(".pdf")) return "pdf";
  if (content.type === "youtube") return "youtube";
  return content.type;
};

const TrainingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trainings, loading, addContent, removeContent, toggleContentComplete, removeTraining } = useTrainings();
  const [showAdd, setShowAdd] = useState(false);
  const [viewer, setViewer] = useState<ContentItem | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const training = trainings.find((t) => t.id === id);

  if (!training) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Treinamento não encontrado</p>
      </div>
    );
  }

  const handleDelete = async () => {
    await removeTraining(training.id);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-2">{training.title}</h1>
        <p className="text-muted-foreground text-sm mb-4">{training.description}</p>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-gold rounded-full transition-all duration-500" style={{ width: `${training.progress}%` }} />
          </div>
          <span className="text-sm font-bold text-primary">{training.progress}%</span>
        </div>
      </header>

      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Conteúdos ({training.contents.length})
          </h2>
        </div>

        <div className="space-y-2">
          {training.contents.map((content) => (
            <div key={content.id} className="relative">
              <ContentCard
                content={content}
                onToggle={() => toggleContentComplete(training.id, content.id)}
                onRemove={() => removeContent(training.id, content.id)}
                onOpen={() => setViewer(content)}
              />
            </div>
          ))}

          {training.contents.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-sm">Nenhum conteúdo adicionado</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 gradient-gold rounded-full flex items-center justify-center shadow-glow hover:scale-105 transition-transform z-40"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      <AddContentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(content) => addContent(training.id, content)}
      />

      {viewer && (
        <ContentViewerModal
          open={!!viewer}
          onClose={() => setViewer(null)}
          title={viewer.title}
          type={getViewerType(viewer)}
          url={viewer.url || (viewer.youtubeId ? `https://www.youtube.com/watch?v=${viewer.youtubeId}` : null)}
          youtubeId={viewer.youtubeId || null}
          onCompleted={() => {
            if (!viewer.completed) toggleContentComplete(training.id, viewer.id);
          }}
        />
      )}
    </div>
  );
};

export default TrainingDetail;
