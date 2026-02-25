import { useState } from "react";
import { Plus, BookOpen, ArrowLeft, Loader2, ClipboardCheck } from "lucide-react";
import { useTrainings } from "@/hooks/useTrainings";
import { useNavigate } from "react-router-dom";
import TrainingCard from "@/components/TrainingCard";
import CreateTrainingModal from "@/components/CreateTrainingModal";

const TrainingsList = () => {
  const { trainings, loading, addTraining } = useTrainings();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const totalProgress = trainings.length > 0
    ? Math.round(trainings.reduce((sum, t) => sum + t.progress, 0) / trainings.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-10 pb-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-2xl font-extrabold text-foreground leading-tight">
          <span className="text-gradient-gold">Treinamentos</span>
        </h1>
      </header>

      {/* Stats */}
      <div className="px-5 mb-6">
        <div className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shadow-glow">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{trainings.length} treinamento{trainings.length !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full gradient-gold rounded-full transition-all duration-700" style={{ width: `${totalProgress}%` }} />
              </div>
              <span className="text-xs font-semibold text-primary">{totalProgress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick link to Presença */}
      <div className="px-5 mb-4">
        <button
          onClick={() => navigate("/presenca-treinamentos")}
          className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Presença Treinamentos</p>
            <p className="text-xs text-muted-foreground">Registrar e consultar presenças</p>
          </div>
        </button>
      </div>

      {/* Training list */}
      <div className="px-5 space-y-3">
        {trainings.map((training, i) => (
          <TrainingCard key={training.id} training={training} index={i} />
        ))}

        {trainings.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum treinamento ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro treinamento</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-6 w-14 h-14 gradient-gold rounded-full flex items-center justify-center shadow-glow hover:scale-105 transition-transform z-40"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      <CreateTrainingModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(data) => addTraining(data)}
      />
    </div>
  );
};

export default TrainingsList;
