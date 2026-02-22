import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Play } from "lucide-react";
import { useTrainingStore } from "@/store/trainingStore";
import ContentCard from "@/components/ContentCard";
import AddContentModal from "@/components/AddContentModal";

const TrainingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trainings, addContent, removeContent, toggleContentComplete, removeTraining } = useTrainingStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showPlayer, setShowPlayer] = useState<string | null>(null);

  const training = trainings.find((t) => t.id === id);

  if (!training) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Treinamento não encontrado</p>
      </div>
    );
  }

  const handleDelete = () => {
    removeTraining(training.id);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* YouTube Player */}
      {showPlayer && (
        <div className="w-full aspect-video bg-background">
          <iframe
            src={`https://www.youtube.com/embed/${showPlayer}?autoplay=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      )}

      {/* Header */}
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

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-gold rounded-full transition-all duration-500" style={{ width: `${training.progress}%` }} />
          </div>
          <span className="text-sm font-bold text-primary">{training.progress}%</span>
        </div>
      </header>

      {/* Content List */}
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
              />
              {content.type === "youtube" && content.youtubeId && (
                <button
                  onClick={() => setShowPlayer(showPlayer === content.youtubeId ? null : content.youtubeId!)}
                  className="absolute right-14 top-1/2 -translate-y-1/2 w-8 h-8 gradient-gold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                >
                  <Play className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />
                </button>
              )}
            </div>
          ))}

          {training.contents.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-sm">Nenhum conteúdo adicionado</p>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
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
    </div>
  );
};

export default TrainingDetail;
