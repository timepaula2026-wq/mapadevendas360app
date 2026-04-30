import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Search, Award, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Profile {
  user_id: string;
  display_name: string | null;
  unit: string | null;
  phone: string | null;
}

interface ProgressRow {
  user_id: string;
  content_id: string;
  section_id: string;
  completed_at: string;
}

interface CertRow {
  user_id: string;
  scope: string;
  scope_ref: string | null;
  section_id: string;
  title: string;
  issued_at: string;
}

interface ContentInfo {
  id: string;
  title: string;
  type: string;
  section_id: string;
}

const AdminUserActivities = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [contents, setContents] = useState<Record<string, ContentInfo>>({});
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [pRes, prRes, cRes, ciRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, unit, phone"),
        supabase.from("trilha_progress").select("user_id, content_id, section_id, completed_at"),
        supabase.from("trilha_certificates").select("user_id, scope, scope_ref, section_id, title, issued_at"),
        supabase.from("section_contents").select("id, title, type, section_id"),
      ]);
      if (pRes.error || prRes.error || cRes.error || ciRes.error) {
        toast.error("Erro ao carregar atividades");
      }
      setProfiles((pRes.data as Profile[]) || []);
      setProgress((prRes.data as ProgressRow[]) || []);
      setCerts((cRes.data as CertRow[]) || []);
      const map: Record<string, ContentInfo> = {};
      ((ciRes.data as ContentInfo[]) || []).forEach((c) => (map[c.id] = c));
      setContents(map);
      setLoading(false);
    };
    load();
  }, []);

  const userStats = useMemo(() => {
    const byUser: Record<string, { progress: ProgressRow[]; certs: CertRow[] }> = {};
    profiles.forEach((p) => (byUser[p.user_id] = { progress: [], certs: [] }));
    progress.forEach((r) => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { progress: [], certs: [] };
      byUser[r.user_id].progress.push(r);
    });
    certs.forEach((r) => {
      if (!byUser[r.user_id]) byUser[r.user_id] = { progress: [], certs: [] };
      byUser[r.user_id].certs.push(r);
    });
    return byUser;
  }, [profiles, progress, certs]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return profiles;
    return profiles.filter(
      (p) =>
        (p.display_name || "").toLowerCase().includes(s) ||
        (p.unit || "").toLowerCase().includes(s)
    );
  }, [profiles, search]);

  const exportAll = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Resumo por usuário
    const summary = profiles.map((p) => {
      const s = userStats[p.user_id] || { progress: [], certs: [] };
      return {
        Nome: p.display_name || "",
        Unidade: p.unit || "",
        Telefone: p.phone || "",
        "Conteúdos Concluídos": s.progress.length,
        "Certificados Emitidos": s.certs.length,
      };
    });
    const ws1 = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

    // Sheet 2: Conteúdos concluídos detalhado
    const detailed = progress.map((r) => {
      const profile = profiles.find((p) => p.user_id === r.user_id);
      const c = contents[r.content_id];
      return {
        Usuário: profile?.display_name || r.user_id,
        Unidade: profile?.unit || "",
        Seção: r.section_id,
        Conteúdo: c?.title || r.content_id,
        Tipo: c?.type || "",
        "Concluído em": new Date(r.completed_at).toLocaleString("pt-BR"),
      };
    });
    const ws2 = XLSX.utils.json_to_sheet(detailed);
    XLSX.utils.book_append_sheet(wb, ws2, "Conteúdos Concluídos");

    // Sheet 3: Certificados
    const certData = certs.map((r) => {
      const profile = profiles.find((p) => p.user_id === r.user_id);
      return {
        Usuário: profile?.display_name || r.user_id,
        Unidade: profile?.unit || "",
        Escopo: r.scope,
        Título: r.title,
        Seção: r.section_id,
        "Emitido em": new Date(r.issued_at).toLocaleString("pt-BR"),
      };
    });
    const ws3 = XLSX.utils.json_to_sheet(certData);
    XLSX.utils.book_append_sheet(wb, ws3, "Certificados");

    XLSX.writeFile(wb, `atividades-usuarios-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exportado!");
  };

  const exportUser = (p: Profile) => {
    const s = userStats[p.user_id] || { progress: [], certs: [] };
    const wb = XLSX.utils.book_new();

    const items = s.progress.map((r) => {
      const c = contents[r.content_id];
      return {
        Seção: r.section_id,
        Conteúdo: c?.title || r.content_id,
        Tipo: c?.type || "",
        "Concluído em": new Date(r.completed_at).toLocaleString("pt-BR"),
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), "Conteúdos");

    const certData = s.certs.map((r) => ({
      Escopo: r.scope,
      Título: r.title,
      Seção: r.section_id,
      "Emitido em": new Date(r.issued_at).toLocaleString("pt-BR"),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(certData), "Certificados");

    const safeName = (p.display_name || "usuario").replace(/[^a-zA-Z0-9]+/g, "_");
    XLSX.writeFile(wb, `atividades-${safeName}.xlsx`);
    toast.success("Excel exportado!");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou unidade..."
            className="pl-9"
          />
        </div>
        <Button onClick={exportAll} className="gap-2">
          <Download className="w-4 h-4" /> Exportar Tudo (Excel)
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Atividades concluídas na Trilha do Iniciante por usuário. Clique em um usuário para detalhes.
      </p>

      <div className="space-y-2">
        {filtered.map((p) => {
          const s = userStats[p.user_id] || { progress: [], certs: [] };
          const isOpen = expanded === p.user_id;
          return (
            <div key={p.user_id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => setExpanded(isOpen ? null : p.user_id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.display_name || "Sem nome"}
                  </p>
                  {p.unit && <p className="text-[10px] text-muted-foreground">📍 {p.unit}</p>}
                  <div className="flex gap-3 mt-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {s.progress.length} conteúdos
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-500" /> {s.certs.length} certificados
                    </span>
                  </div>
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportUser(p)}
                  disabled={s.progress.length === 0 && s.certs.length === 0}
                  className="gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Excel
                </Button>
              </div>

              {isOpen && (
                <div className="border-t border-border p-3 space-y-3 bg-secondary/30">
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Conteúdos concluídos ({s.progress.length})
                    </p>
                    {s.progress.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">Nenhum conteúdo concluído ainda.</p>
                    ) : (
                      <div className="space-y-1">
                        {s.progress
                          .slice()
                          .sort((a, b) => +new Date(b.completed_at) - +new Date(a.completed_at))
                          .map((r) => {
                            const c = contents[r.content_id];
                            return (
                              <div
                                key={r.content_id + r.completed_at}
                                className="flex items-center justify-between gap-2 text-[11px] py-1 px-2 bg-card rounded"
                              >
                                <span className="text-foreground truncate flex-1">
                                  {c?.title || r.content_id}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  {new Date(r.completed_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      Certificados ({s.certs.length})
                    </p>
                    {s.certs.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">Nenhum certificado emitido.</p>
                    ) : (
                      <div className="space-y-1">
                        {s.certs.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2 text-[11px] py-1 px-2 bg-card rounded"
                          >
                            <span className="text-foreground truncate flex-1">
                              <Award className="w-3 h-3 inline text-amber-500 mr-1" />
                              {r.title}{" "}
                              <span className="text-muted-foreground">({r.scope})</span>
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              {new Date(r.issued_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserActivities;