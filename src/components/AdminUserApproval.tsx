import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Users as UsersIcon,
  FileText,
  Eye,
  BookOpen,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  approved: boolean;
  created_at: string;
  phone: string | null;
  unit: string | null;
  unit_start_date: string | null;
  last_active_at: string | null;
  cpf: string | null;
}

const ROLE_LABELS_PT: Record<string, string> = {
  iniciante: "Consultor Iniciante",
  autorizado: "Consultor Autorizado",
  supervisor: "Supervisor",
  gestor: "Gestor de Unidade",
  secretaria: "Administrativo",
  admin: "Administrador",
};

type Filter = "pending" | "approved" | "all";

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const formatDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR") : "—";

const daysSince = (d?: string | null) => {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const csvEscape = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadFile = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminUserApproval = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rolesByUser, setRolesByUser] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [details, setDetails] = useState<{
    trainings: { title: string; created_at: string }[];
    progress: number;
    certificates: { title: string; issued_at: string }[];
    planejamentos: number;
    lastActive: string | null;
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (profilesRes.error) toast.error("Erro ao carregar usuários");
    else setUsers((profilesRes.data || []) as UserProfile[]);
    const map: Record<string, string[]> = {};
    (rolesRes.data || []).forEach((r: any) => {
      (map[r.user_id] ||= []).push(r.role);
    });
    setRolesByUser(map);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const ROLE_TO_ACTIVITY: Record<string, string> = {
    iniciante: "consultor iniciante",
    autorizado: "consultor autorizado",
    gestor: "gestor de unidade",
    secretaria: "administrativo",
    supervisor: "supervisor",
    admin: "administrador",
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "pending" && u.approved) return false;
      if (filter === "approved" && !u.approved) return false;
      if (!term) return true;
      const roles = rolesByUser[u.user_id] || [];
      const activities = roles.map((r) => ROLE_TO_ACTIVITY[r] || r);
      return (
        (u.display_name || "").toLowerCase().includes(term) ||
        (u.unit || "").toLowerCase().includes(term) ||
        (u.phone || "").toLowerCase().includes(term) ||
        (u.cpf || "").toLowerCase().includes(term) ||
        roles.some((r) => r.toLowerCase().includes(term)) ||
        activities.some((a) => a.includes(term))
      );
    });
  }, [users, filter, search, rolesByUser]);

  const counts = useMemo(
    () => ({
      pending: users.filter((u) => !u.approved).length,
      approved: users.filter((u) => u.approved).length,
      total: users.length,
    }),
    [users],
  );

  const handleApprove = async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ approved: approve })
      .eq("user_id", userId);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success(approve ? "Usuário aprovado!" : "Acesso revogado");
      fetchUsers();
    }
  };

  const exportCSV = () => {
    const headers = [
      "Nome",
      "CPF",
      "Telefone",
      "Unidade",
      "Início na unidade",
      "Status",
      "Cadastro",
      "Última atividade",
      "Dias inativo",
    ];
    const rows = filtered.map((u) => [
      u.display_name || "",
      u.cpf || "",
      u.phone || "",
      u.unit || "",
      u.unit_start_date ? formatDate(u.unit_start_date) : "",
      u.approved ? "Aprovado" : "Pendente",
      formatDate(u.created_at),
      formatDateTime(u.last_active_at),
      daysSince(u.last_active_at) ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(csvEscape).join(";"))
      .join("\n");
    downloadFile(
      "\uFEFF" + csv,
      `usuarios-${filter}-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );
    toast.success("CSV exportado");
  };

  const exportReport = () => {
    const lines: string[] = [];
    lines.push("RELATÓRIO DE USUÁRIOS - MAPA DE VENDAS");
    lines.push(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
    lines.push(
      `Filtro: ${filter === "pending" ? "Pendentes" : filter === "approved" ? "Aprovados" : "Todos"}`,
    );
    lines.push("");
    lines.push(
      `Total: ${counts.total}  |  Aprovados: ${counts.approved}  |  Pendentes: ${counts.pending}`,
    );
    lines.push("");
    lines.push("=".repeat(60));
    filtered.forEach((u, i) => {
      const inactive = daysSince(u.last_active_at);
      lines.push(`${i + 1}. ${u.display_name || "Sem nome"}`);
      lines.push(`   Status: ${u.approved ? "Aprovado" : "Pendente"}`);
      if (u.cpf) lines.push(`   CPF: ${u.cpf}`);
      if (u.phone) lines.push(`   Telefone: ${u.phone}`);
      if (u.unit) lines.push(`   Unidade: ${u.unit}`);
      if (u.unit_start_date)
        lines.push(`   Início na unidade: ${formatDate(u.unit_start_date)}`);
      lines.push(`   Cadastro: ${formatDate(u.created_at)}`);
      lines.push(
        `   Última atividade: ${formatDateTime(u.last_active_at)}${
          inactive != null ? ` (${inactive} dias)` : ""
        }`,
      );
      lines.push("");
    });
    downloadFile(
      lines.join("\n"),
      `relatorio-usuarios-${new Date().toISOString().slice(0, 10)}.txt`,
      "text/plain;charset=utf-8;",
    );
    toast.success("Relatório gerado");
  };

  const openDetails = async (u: UserProfile) => {
    setSelected(u);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const [trainingsRes, progressRes, certsRes, planRes] = await Promise.all([
        supabase
          .from("trainings")
          .select("title, created_at")
          .eq("user_id", u.user_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trilha_progress")
          .select("id")
          .eq("user_id", u.user_id),
        supabase
          .from("trilha_certificates")
          .select("title, issued_at")
          .eq("user_id", u.user_id)
          .order("issued_at", { ascending: false }),
        supabase
          .from("planejamento_entries")
          .select("id")
          .eq("user_id", u.user_id),
      ]);
      setDetails({
        trainings: (trainingsRes.data || []) as any,
        progress: progressRes.data?.length || 0,
        certificates: (certsRes.data || []) as any,
        planejamentos: planRes.data?.length || 0,
        lastActive: u.last_active_at,
      });
    } catch (e) {
      toast.error("Erro ao carregar detalhes");
    } finally {
      setDetailsLoading(false);
    }
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
      {/* Filtros */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { id: "pending", label: "Pendentes", count: counts.pending },
            { id: "approved", label: "Aprovados", count: counts.approved },
            { id: "all", label: "Todos", count: counts.total },
          ] as { id: Filter; label: string; count: number }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-80">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Busca + Exportar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/matrícula, unidade, papel ou atividade..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button onClick={exportCSV} size="sm" variant="outline" className="gap-1">
          <Download className="w-4 h-4" /> CSV
        </Button>
        <Button onClick={exportReport} size="sm" variant="outline" className="gap-1">
          <FileText className="w-4 h-4" /> Relatório
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map((u) => {
          const inactive = daysSince(u.last_active_at);
          return (
            <div
              key={u.id}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.display_name || "Sem nome"}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        u.approved
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {u.approved ? "Aprovado" : "Pendente"}
                    </span>
                  </div>
                  {u.cpf && (
                    <p className="text-[10px] text-muted-foreground">
                      🆔 {u.cpf}
                    </p>
                  )}
                  {u.phone && (
                    <p className="text-[10px] text-muted-foreground">
                      📱 {u.phone}
                    </p>
                  )}
                  {u.unit && (
                    <p className="text-[10px] text-muted-foreground">
                      📍 {u.unit}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Cadastro: {formatDate(u.created_at)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Última atividade: {formatDateTime(u.last_active_at)}
                    {inactive != null && (
                      <span
                        className={
                          inactive > 15
                            ? " text-yellow-500 font-medium"
                            : ""
                        }
                      >
                        {" "}
                        ({inactive}d)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    onClick={() => openDetails(u)}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded"
                    title="Ver cursos e uso"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!u.approved ? (
                    <button
                      onClick={() => handleApprove(u.user_id, true)}
                      className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                      title="Aprovar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(u.user_id, false)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
                      title="Revogar"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.display_name || "Usuário"}</DialogTitle>
            <DialogDescription>
              Cursos e uso do app
            </DialogDescription>
          </DialogHeader>

          {detailsLoading || !details ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Uso do app */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">Uso do app</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Última atividade</p>
                    <p className="font-medium">
                      {formatDateTime(details.lastActive)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dias inativo</p>
                    <p className="font-medium">
                      {daysSince(details.lastActive) ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Planejamentos</p>
                    <p className="font-medium">{details.planejamentos}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conteúdos concluídos</p>
                    <p className="font-medium">{details.progress}</p>
                  </div>
                </div>
              </div>

              {/* Certificados */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">
                    Certificados ({details.certificates.length})
                  </h4>
                </div>
                {details.certificates.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum certificado emitido
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {details.certificates.map((c, i) => (
                      <li
                        key={i}
                        className="text-xs flex justify-between gap-2 border-b border-border/50 py-1"
                      >
                        <span className="truncate">{c.title}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatDate(c.issued_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Treinamentos criados */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">
                    Treinamentos criados ({details.trainings.length})
                  </h4>
                </div>
                {details.trainings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum</p>
                ) : (
                  <ul className="space-y-1">
                    {details.trainings.map((t, i) => (
                      <li
                        key={i}
                        className="text-xs flex justify-between gap-2 border-b border-border/50 py-1"
                      >
                        <span className="truncate">{t.title}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatDate(t.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserApproval;