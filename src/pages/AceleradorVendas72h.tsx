import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Download, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  PARTE1_STEPS,
  DAY1_TASKS,
  DAY2_TASKS,
  DAY3_TASKS,
  ESSENCIAIS_TASKS,
  TABELA_IMOVEIS,
  TABELA_VEICULOS,
  TABELA_SERVICOS,
  ROTEIRO_VENDAS,
} from "@/lib/acelerador72h";

type ProgressRow = {
  id: string;
  user_id: string;
  nome: string | null;
  data_inicio: string | null;
  week_start: string;
  steps: boolean[];
  day1: boolean[];
  day2: boolean[];
  day3: boolean[];
  essenciais: boolean[];
};

// Segunda-feira da semana de referência, no formato YYYY-MM-DD
const getWeekStart = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const emptyArr = (n: number) => Array(n).fill(false);

const AceleradorVendas72h = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [row, setRow] = useState<ProgressRow | null>(null);
  const [isNewWeek, setIsNewWeek] = useState(false);

  const currentWeekStart = getWeekStart(new Date());

  useEffect(() => {
    if (user) loadProgress();
  }, [user]);

  const loadProgress = async () => {
    setLoading(true);
    const { data: existing } = await supabase
      .from("acelerador72h_progress")
      .select("*")
      .eq("user_id", user!.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setRow(existing as unknown as ProgressRow);
      setIsNewWeek(existing.week_start !== currentWeekStart);
      setLoading(false);
      return;
    }

    // Primeiro acesso: busca nome do perfil e cria registro da semana atual
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user!.id)
      .maybeSingle();

    const fresh = {
      user_id: user!.id,
      nome: profile?.display_name || "",
      data_inicio: new Date().toISOString().slice(0, 10),
      week_start: currentWeekStart,
      steps: emptyArr(PARTE1_STEPS.length),
      day1: emptyArr(DAY1_TASKS.length),
      day2: emptyArr(DAY2_TASKS.length),
      day3: emptyArr(DAY3_TASKS.length),
      essenciais: emptyArr(ESSENCIAIS_TASKS.length),
    };
    const { data: inserted } = await supabase
      .from("acelerador72h_progress")
      .insert(fresh as never)
      .select("*")
      .single();
    setRow((inserted as unknown as ProgressRow) || null);
    setIsNewWeek(false);
    setLoading(false);
  };

  const persist = async (patch: Partial<ProgressRow>) => {
    if (!row) return;
    const updated = { ...row, ...patch };
    setRow(updated);
    setSaving(true);
    await supabase
      .from("acelerador72h_progress")
      .update(patch as never)
      .eq("id", row.id);
    setSaving(false);
  };

  const toggleItem = (field: "steps" | "day1" | "day2" | "day3" | "essenciais", idx: number) => {
    if (!row) return;
    const arr = [...row[field]];
    arr[idx] = !arr[idx];
    persist({ [field]: arr } as Partial<ProgressRow>);
  };

  const startNewWeek = async () => {
    if (!row) return;
    const fresh = {
      user_id: user!.id,
      nome: row.nome,
      data_inicio: new Date().toISOString().slice(0, 10),
      week_start: currentWeekStart,
      steps: emptyArr(PARTE1_STEPS.length),
      day1: emptyArr(DAY1_TASKS.length),
      day2: emptyArr(DAY2_TASKS.length),
      day3: emptyArr(DAY3_TASKS.length),
      essenciais: emptyArr(ESSENCIAIS_TASKS.length),
    };
    const { data: inserted } = await supabase
      .from("acelerador72h_progress")
      .insert(fresh as never)
      .select("*")
      .single();
    if (inserted) {
      setRow(inserted as unknown as ProgressRow);
      setIsNewWeek(false);
      toast.success("Nova semana iniciada! Checklist reiniciado.");
    }
  };

  const allTasks = row ? [...row.day1, ...row.day2, ...row.day3, ...row.essenciais] : [];
  const totalDone = allTasks.filter(Boolean).length;
  const totalTasks = allTasks.length;
  const pct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const buildPrintableHtml = () => {
    const content = printRef.current?.innerHTML || "";
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; padding: 24px; font-size: 11pt; line-height: 1.5; color: #111; background: #fff; max-width: 800px; margin: 0 auto;">
        <style>
          * { box-sizing: border-box; }
          h2 { font-size: 13pt; margin: 14px 0 8px; color: #7a1f3d; }
          h3 { font-size: 11.5pt; margin: 10px 0 4px; color: #111; }
          p, li { color: #111; }
          .pdf-item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
          .pdf-box { width: 14px; height: 14px; border: 1.5px solid #333; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
          .pdf-box.done { background: #16a34a; border-color: #16a34a; color: #fff; }
          table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          td, th { border: 1px solid #ccc; padding: 4px 8px; font-size: 10pt; }
          button, [role="button"], .no-print { display: none !important; }
        </style>
        ${content}
      </div>
    `;
  };

  const handleDownloadPdf = async () => {
    if (!row) return;
    setDownloading(true);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildPrintableHtml();
      document.body.appendChild(wrapper);
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `Acelerador-72h-${(row.nome || "consultor").replace(/\s+/g, "-")}-${row.week_start}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        } as unknown as Record<string, unknown>)
        .from(wrapper)
        .save();
      document.body.removeChild(wrapper);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !row) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Zap className="w-7 h-7 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">Acelerador de Vendas 72h</h1>
              <p className="text-white/70 text-xs mt-0.5">
                Semana de {new Date(row.week_start + "T00:00:00").toLocaleDateString("pt-BR")}
                {saving && " · salvando..."}
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadPdf}
            disabled={downloading}
            size="sm"
            className="bg-white/15 hover:bg-white/25 text-white gap-1.5"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </Button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-white/80 text-xs mb-1.5">
            <span>Progresso da semana</span>
            <span className="font-semibold">{pct}% ({totalDone}/{totalTasks})</span>
          </div>
          <Progress value={pct} className="h-2.5 bg-white/20" />
        </div>
      </div>

      {isNewWeek && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-sm text-foreground mb-3">
            Esta é uma nova semana. Baixe o PDF da semana anterior antes de reiniciar o checklist, se quiser guardar o registro.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownloadPdf}>
              <Download className="w-3.5 h-3.5" /> Baixar semana anterior
            </Button>
            <Button size="sm" className="gap-1.5" onClick={startNewWeek}>
              <RotateCcw className="w-3.5 h-3.5" /> Iniciar nova semana
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 mt-5" ref={printRef}>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={row.nome || ""}
              onChange={(e) => persist({ nome: e.target.value })}
              placeholder="Seu nome"
            />
          </div>
          <div>
            <Label className="text-xs">Data de início</Label>
            <Input
              type="date"
              value={row.data_inicio || ""}
              onChange={(e) => persist({ data_inicio: e.target.value })}
            />
          </div>
        </div>

        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="checklist">Checklist 72h</TabsTrigger>
            <TabsTrigger value="roteiro">Roteiro & Valores</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-5">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Parte 1 — Roteiro de 72h</h2>
            <div className="grid grid-cols-5 gap-2">
              {PARTE1_STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggleItem("steps", i)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-colors ${
                    row.steps[i] ? "bg-primary/10 border-primary" : "bg-card border-border"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      row.steps[i] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.steps[i] ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] leading-tight text-foreground/80">{step}</span>
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mt-6">
              Parte 2 — Tarefas diárias
            </h2>

            {[
              { title: "1º dia — 24 horas", tasks: DAY1_TASKS, field: "day1" as const },
              { title: "2º dia — 48 horas", tasks: DAY2_TASKS, field: "day2" as const },
              { title: "3º dia — 72 horas", tasks: DAY3_TASKS, field: "day3" as const },
            ].map((d) => (
              <Card key={d.field}>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-bold mb-2.5 text-foreground">{d.title}</h3>
                  <div className="space-y-2">
                    {d.tasks.map((t, i) => (
                      <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={row[d.field][i]}
                          onCheckedChange={() => toggleItem(d.field, i)}
                          className="mt-0.5"
                        />
                        <span className={`text-xs ${row[d.field][i] ? "line-through text-muted-foreground" : "text-foreground/90"}`}>
                          {t}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-bold mb-2.5 text-foreground">Tarefas diárias essenciais</h3>
                <div className="space-y-2">
                  {ESSENCIAIS_TASKS.map((t, i) => (
                    <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={row.essenciais[i]}
                        onCheckedChange={() => toggleItem("essenciais", i)}
                        className="mt-0.5"
                      />
                      <span className={`text-xs ${row.essenciais[i] ? "line-through text-muted-foreground" : "text-foreground/90"}`}>
                        {t}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roteiro" className="space-y-5">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wide">Roteiro de vendas em 72h</h2>
            <Accordion type="single" collapsible className="w-full">
              {ROTEIRO_VENDAS.map((r, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-xs font-semibold text-left">{r.titulo}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground whitespace-pre-line">
                    {r.texto}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <h2 className="text-sm font-bold text-primary uppercase tracking-wide mt-6">
              Tabela de valores para se basear
            </h2>
            {[
              { title: "Imóveis", rows: TABELA_IMOVEIS },
              { title: "Veículos", rows: TABELA_VEICULOS },
              { title: "Serviços", rows: TABELA_SERVICOS },
            ].map((t) => (
              <Card key={t.title}>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-bold mb-2.5 text-foreground">{t.title}</h3>
                  <table className="w-full text-xs">
                    <tbody>
                      {t.rows.map(([a, b], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                          <td className="py-1.5 px-2 text-foreground/80">{a}</td>
                          <td className="py-1.5 px-2 text-right font-medium text-foreground">{b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AceleradorVendas72h;
