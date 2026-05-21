import { CalendarDays, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AgendaOnlineBlock = () => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate("/agenda")}
      className="flex items-center gap-4 p-4 rounded-xl border bg-card border-primary/30 cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <CalendarDays className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Agenda Online</p>
        <p className="text-xs text-muted-foreground">Agende e gerencie seus compromissos</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
};

export default AgendaOnlineBlock;