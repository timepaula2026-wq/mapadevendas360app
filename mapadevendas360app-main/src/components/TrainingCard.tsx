import { Training } from "@/types/training";
import { Play, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrainingCardProps {
  training: Training;
  index: number;
}

const categoryColors: Record<string, string> = {
  Desenvolvimento: "bg-blue-500/10 text-blue-400",
  Design: "bg-pink-500/10 text-pink-400",
  Marketing: "bg-green-500/10 text-green-400",
  Vendas: "bg-orange-500/10 text-orange-400",
};

const TrainingCard = ({ training, index }: TrainingCardProps) => {
  const navigate = useNavigate();
  const videoCount = training.contents.filter((c) => c.type === "youtube").length;
  const fileCount = training.contents.filter((c) => c.type !== "youtube").length;
  const colorClass = categoryColors[training.category] || "bg-primary/10 text-primary";

  return (
    <button
      onClick={() => navigate(`/training/${training.id}`)}
      className="glass-card rounded-xl p-5 text-left w-full hover:border-primary/30 transition-all duration-300 animate-fade-up group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${colorClass}`}>
          {training.category}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <h3 className="font-bold text-foreground text-lg mb-1.5 leading-tight">{training.title}</h3>
      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{training.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {videoCount > 0 && (
          <span className="flex items-center gap-1">
            <Play className="w-3.5 h-3.5" /> {videoCount} vídeo{videoCount > 1 ? "s" : ""}
          </span>
        )}
        {fileCount > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {fileCount} arquivo{fileCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full gradient-gold rounded-full transition-all duration-500"
          style={{ width: `${training.progress}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{training.progress}% concluído</p>
    </button>
  );
};

export default TrainingCard;
