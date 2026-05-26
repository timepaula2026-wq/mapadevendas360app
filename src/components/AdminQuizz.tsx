import { useEffect, useState } from "react";
import { Loader2, Trash2, ExternalLink, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Row { id: string; title: string; description: string | null; user_id: string; created_at: string; }

const AdminQuizz = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar"); else setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir este quiz?")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir"); else { toast.success("Excluído"); load(); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Total: {rows.length} quizzes</p>
        <Button size="sm" onClick={() => navigate("/quizz")} className="gap-2"><ExternalLink className="w-3.5 h-3.5" /> Abrir Quizz</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum quiz cadastrado</p>
        </div>
      ) : (
        rows.map((q) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{q.title}</h3>
              {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
            </div>
            <button onClick={() => navigate(`/quizz/edit/${q.id}`)} className="text-xs text-primary hover:underline">Editar</button>
            <button onClick={() => remove(q.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminQuizz;