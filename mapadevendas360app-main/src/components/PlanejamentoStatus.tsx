import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, TrendingUp, Target, History, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Entry = {
  id?: string;
  week_start: string;
  meta_prospec: number;
  meta_atendimentos: number;
  meta_vendas_lar: number;
  meta_vendas_motors: number;
  meta_faturamento: number;
  realizado_prospec: number;
  realizado_atendimentos: number;
  realizado_vendas_lar: number;
  realizado_vendas_motors: number;
  realizado_faturamento: number;
  observacoes?: string | null;
};

const FIELDS: { meta: keyof Entry; real: keyof Entry; label: string; type: "int" | "money" }[] = [
  { meta: "meta_prospec", real: "realizado_prospec", label: "Prospecções", type: "int" },
  { meta: "meta_atendimentos", real: "realizado_atendimentos", label: "Atendimentos", type: "int" },
  { meta: "meta_vendas_lar", real: "realizado_vendas_lar", label: "Vendas Lar", type: "int" },
  { meta: "meta_vendas_motors", real: "realizado_vendas_motors", label: "Vendas Motors", type: "int" },
  { meta: "meta_faturamento", real: "realizado_faturamento", label: "Faturamento (R$)", type: "money" },
];

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

const emptyEntry = (week: string): Entry => ({
  week_start: week,
  meta_prospec: 0, meta_atendimentos: 0, meta_vendas_lar: 0, meta_vendas_motors: 0, meta_faturamento: 0,
  realizado_prospec: 0, realizado_atendimentos: 0, realizado_vendas_lar: 0, realizado_vendas_motors: 0, realizado_faturamento: 0,
  observacoes: "",
});

const formatBR = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const PlanejamentoStatus = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Entry[]>([]);
  const [current, setCurrent] = useState<Entry>(emptyEntry(getMonday()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("planejamento_entries" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false });
    if (error) toast.error("Erro ao carregar histórico");
    const rows = (data as any[] as Entry[]) || [];
    setHistory(rows);
    const week = current.week_start;
    const found = rows.find((r) => r.week_start === week);
    setCurrent(found ?? emptyEntry(week));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onChangeWeek = (week: string) => {
    const found = history.find((r) => r.week_start === week);
    setCurrent(found ?? emptyEntry(week));
  };

  const onField = (key: keyof Entry, value: string) => {
    setCurrent((c) => ({ ...c, [key]: key === "observacoes" ? value : Number(value || 0) } as Entry));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload: any = { ...current, user_id: user.id };
    delete payload.id;
    const { error } = await supabase
      .from("planejamento_entries" as any)
      .upsert(payload, { onConflict: "user_id,week_start" });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Acompanhamento salvo");
    loadAll();
  };

  const removeWeek = async (id?: string) => {
    if (!id) return;
    if (!confirm("Excluir registro desta semana?")) return;
    const { error } = await supabase.from("planejamento_entries" as any).delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Removido");
    loadAll();
  };

  const totals = useMemo(() => {
    const acc = { metaFat: 0, realFat: 0, metaVendas: 0, realVendas: 0 };
    history.forEach((h) => {
      acc.metaFat += Number(h.meta_faturamento) || 0;
      acc.realFat += Number(h.realizado_faturamento) || 0;
      acc.metaVendas += (h.meta_vendas_lar || 0) + (h.meta_vendas_motors || 0);
      acc.realVendas += (h.realizado_vendas_lar || 0) + (h.realizado_vendas_motors || 0);
    });
    return acc;
  }, [history]);

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={Target} label="Meta total faturamento" value={`R$ ${totals.metaFat.toLocaleString("pt-BR")}`} />
        <SummaryCard icon={TrendingUp} label="Realizado total" value={`R$ ${totals.realFat.toLocaleString("pt-BR")}`}
          accent={totals.realFat >= totals.metaFat && totals.metaFat > 0} />
        <SummaryCard icon={Target} label="Meta vendas (semanas)" value={String(totals.metaVendas)} />
        <SummaryCard icon={TrendingUp} label="Vendas realizadas" value={String(totals.realVendas)}
          accent={totals.realVendas >= totals.metaVendas && totals.metaVendas > 0} />
      </div>

      {/* Editor da semana */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="font-bold text-primary text-base">Acompanhamento semanal</h3>
            <p className="text-xs text-muted-foreground">Registre metas e o que foi realizado</p>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Semana de:</span>
            <input
              type="date"
              value={current.week_start}
              onChange={(e) => onChangeWeek(e.target.value || getMonday())}
              className="bg-background border border-border rounded-md px-2 py-1 text-sm"
            />
          </label>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-semibold py-2 pr-2">Indicador</th>
                <th className="font-semibold py-2 px-2">Meta</th>
                <th className="font-semibold py-2 px-2">Realizado</th>
                <th className="font-semibold py-2 pl-2">%</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((f) => {
                const meta = Number(current[f.meta]) || 0;
                const real = Number(current[f.real]) || 0;
                const pct = meta > 0 ? Math.round((real / meta) * 100) : 0;
                return (
                  <tr key={f.meta} className="border-t border-border/50">
                    <td className="py-2 pr-2 font-medium">{f.label}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min={0} step={f.type === "money" ? "0.01" : "1"}
                        value={meta || ""}
                        onChange={(e) => onField(f.meta, e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min={0} step={f.type === "money" ? "0.01" : "1"}
                        value={real || ""}
                        onChange={(e) => onField(f.real, e.target.value)}
                        className="w-full bg-background border border-border rounded-md px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-2 pl-2">
                      <span className={`text-xs font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 70 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <label className="block mt-4">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Observações da semana</span>
          <textarea
            value={current.observacoes || ""}
            onChange={(e) => onField("observacoes", e.target.value)}
            rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-y mt-1"
            placeholder="Fatos, causas, ações para a próxima semana..."
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar semana
        </button>
      </div>

      {/* Histórico */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-primary text-base">Histórico de semanas</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum registro ainda. Salve sua primeira semana acima.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-semibold py-2 pr-2">Semana</th>
                  <th className="font-semibold py-2 px-2">Prospec</th>
                  <th className="font-semibold py-2 px-2">Atend.</th>
                  <th className="font-semibold py-2 px-2">Vendas</th>
                  <th className="font-semibold py-2 px-2">Faturamento</th>
                  <th className="font-semibold py-2 px-2">% Meta</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const vendas = (h.realizado_vendas_lar || 0) + (h.realizado_vendas_motors || 0);
                  const metaVendas = (h.meta_vendas_lar || 0) + (h.meta_vendas_motors || 0);
                  const pct = h.meta_faturamento > 0
                    ? Math.round((Number(h.realizado_faturamento) / Number(h.meta_faturamento)) * 100)
                    : 0;
                  return (
                    <tr key={h.id} className="border-t border-border/50">
                      <td className="py-2 pr-2 font-semibold">{formatBR(h.week_start)}</td>
                      <td className="py-2 px-2 text-center">{h.realizado_prospec}/{h.meta_prospec}</td>
                      <td className="py-2 px-2 text-center">{h.realizado_atendimentos}/{h.meta_atendimentos}</td>
                      <td className="py-2 px-2 text-center">{vendas}/{metaVendas}</td>
                      <td className="py-2 px-2 text-center">R$ {Number(h.realizado_faturamento).toLocaleString("pt-BR")}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`font-bold ${pct >= 100 ? "text-emerald-500" : pct >= 70 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onChangeWeek(h.week_start)}
                            className="text-primary hover:underline text-xs font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removeWeek(h.id)}
                            className="text-destructive hover:bg-destructive/10 p-1 rounded"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <button
          onClick={() => onChangeWeek(getMonday())}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Nova semana (atual)
        </button>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) => (
  <div className={`rounded-xl border p-3 ${accent ? "border-emerald-500/40 bg-emerald-500/5" : "border-border bg-card"}`}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
      <Icon className="w-3 h-3" /> {label}
    </div>
    <div className={`mt-1 text-lg font-extrabold ${accent ? "text-emerald-500" : "text-foreground"}`}>{value}</div>
  </div>
);

export default PlanejamentoStatus;