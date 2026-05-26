import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { validateEmail } from "@/lib/emailValidation";

type Row = {
  email: string;
  display_name: string;
  phone?: string;
  unit?: string;
  activity?: string;
  matricula_cpf?: string;
};

function parseCSV(text: string): Row[] {
  // detect delimiter
  const firstLine = text.split(/\r?\n/)[0] || "";
  const delim = firstLine.includes(";") ? ";" : ",";
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase());
  // detect indexes
  const idx = (matchers: string[]) =>
    headers.findIndex((h) => matchers.some((m) => h.includes(m)));
  const iName = idx(["nome"]);
  const iPhone = idx(["whats", "telefone", "celular", "phone"]);
  const iEmail = idx(["mail"]);
  const iUnit = idx(["unidade", "loja"]);
  const iActivity = idx(["atividade", "função", "funcao", "cargo"]);
  const iMat = idx(["matrícula", "matricula", "cpf"]);

  return lines.slice(1).map((line) => {
    const cells = line.split(delim);
    return {
      display_name: (cells[iName] || "").trim(),
      phone: iPhone >= 0 ? (cells[iPhone] || "").trim() : "",
      email: (cells[iEmail] || "").trim(),
      unit: iUnit >= 0 ? (cells[iUnit] || "").trim() : "",
      activity: iActivity >= 0 ? (cells[iActivity] || "").trim() : "",
      matricula_cpf: iMat >= 0 ? (cells[iMat] || "").trim() : "",
    };
  }).filter((r) => r.email);
}

export default function AdminBulkImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const onFile = async (f: File) => {
    const text = await f.text();
    const parsed = parseCSV(text);
    setRows(parsed);
    setResults(null);
    toast.success(`${parsed.length} linhas detectadas`);
  };

  const doImport = async () => {
    if (!rows.length) return;
    // Validar e-mails antes de enviar
    const invalid: { email: string; error: string }[] = [];
    const valid: Row[] = [];
    for (const r of rows) {
      const v = validateEmail(r.email);
      if (!v.valid) invalid.push({ email: r.email, error: v.error || "inválido" });
      else valid.push({ ...r, email: v.email! });
    }
    if (invalid.length) {
      setResults(invalid.map((i) => ({ email: i.email, status: "skip", message: i.error })));
      toast.error(`${invalid.length} e-mail(s) inválido(s) — corrija o CSV e tente novamente`);
      if (!valid.length) return;
    }
    setLoading(true);
    try {
      // chunk by 50 to keep edge function within timeout
      const chunks: Row[][] = [];
      for (let i = 0; i < valid.length; i += 50) chunks.push(valid.slice(i, i + 50));
      const all: any[] = [];
      for (const c of chunks) {
        const { data, error } = await supabase.functions.invoke("bulk-import-users", {
          body: { rows: c, password: "123456" },
        });
        if (error) throw error;
        all.push(...(data?.results || []));
      }
      setResults([
        ...invalid.map((i) => ({ email: i.email, status: "skip", message: i.error })),
        ...all,
      ]);
      const ok = all.filter((r) => r.status === "created" || r.status === "updated").length;
      toast.success(`Importação concluída: ${ok}/${valid.length}`);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao importar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Importar usuários (CSV)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Colunas aceitas: Nome, WhatsApp, E-mail, Unidade, Atividade, Matrícula/CPF. Senha provisória <b>123456</b>.
        No primeiro acesso, cada usuário definirá a própria senha dentro do app.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
          <Upload className="w-4 h-4" /> Selecionar CSV
        </Button>
        <Button size="sm" disabled={!rows.length || loading} onClick={doImport} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Importar {rows.length || ""} usuários
        </Button>
      </div>
      {results && (
        <div className="max-h-60 overflow-auto text-xs space-y-1 mt-2 border border-border rounded p-2">
          {results.map((r, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="truncate">{r.email}</span>
              <span className={
                r.status === "created" ? "text-green-500" :
                r.status === "updated" ? "text-blue-500" :
                r.status === "skip" ? "text-yellow-500" : "text-destructive"
              }>{r.status}{r.message ? ` — ${r.message}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}