import { useState, useEffect, useCallback } from "react";
import { UNITS } from "@/lib/units";
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, List, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  unit: string;
  responsible: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  agendado: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmado: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
  concluido: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h to 20h

const GOOGLE_CALENDAR_SRC = "coordenacaocomercial.ademilar@gmail.com";
const GOOGLE_CALENDAR_EMBED_URL = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(GOOGLE_CALENDAR_SRC)}&ctz=America/Sao_Paulo&mode=MONTH`;


const Agenda = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("home");
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showGoogle, setShowGoogle] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formResponsible, setFormResponsible] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("agendado");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (!error && data) setAppointments(data as Appointment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAppointments]);

  const resetForm = () => {
    setFormName(""); setFormPhone(""); setFormEmail(""); setFormUnit("");
    setFormResponsible(""); setFormDate(""); setFormStartTime(""); setFormEndTime("");
    setFormNotes(""); setFormStatus("agendado"); setEditingAppointment(null);
  };

  const openCreateDialog = (date?: Date) => {
    resetForm();
    if (date) setFormDate(format(date, "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  const openEditDialog = (apt: Appointment) => {
    setEditingAppointment(apt);
    setFormName(apt.name); setFormPhone(apt.phone); setFormEmail(apt.email || "");
    setFormUnit(apt.unit); setFormResponsible(apt.responsible);
    setFormDate(apt.date); setFormStartTime(apt.start_time.slice(0, 5));
    setFormEndTime(apt.end_time.slice(0, 5)); setFormNotes(apt.notes || "");
    setFormStatus(apt.status);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPhone || !formUnit || !formResponsible || !formDate || !formStartTime || !formEndTime) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const payload = {
      name: formName, phone: formPhone, email: formEmail || null,
      unit: formUnit, responsible: formResponsible, date: formDate,
      start_time: formStartTime, end_time: formEndTime,
      notes: formNotes || null, status: formStatus,
      created_by: user?.id || null,
    };

    if (editingAppointment) {
      const { error } = await supabase.from("appointments").update(payload).eq("id", editingAppointment.id);
      if (error) { toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Agendamento atualizado!" });
    } else {
      const { error } = await supabase.from("appointments").insert(payload);
      if (error) {
        if (error.message.includes("idx_no_double_booking")) {
          toast({ title: "Conflito de horário", description: "Já existe um agendamento neste horário.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
        }
        return;
      }
      toast({ title: "Agendamento criado!" });
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (!error) toast({ title: "Agendamento excluído!" });
  };

  const navigateDate = (dir: "prev" | "next") => {
    if (view === "month") setCurrentDate(dir === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === "week") setCurrentDate(dir === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === "next" ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const getAppointmentsForDate = (date: Date) =>
    appointments.filter((a) => a.date === format(date, "yyyy-MM-dd") && a.status !== "cancelado");

  // Share link
  const shareLink = `${window.location.origin}/agendar`;

  // Month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Week view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 0 }) });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button onClick={() => navigate("/")} className="text-white/80 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gradient-gold flex-1">Agenda Online</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => openCreateDialog()} className="gap-1">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        )}
      </header>

      {/* Share link */}
      <div className="px-5 mb-4">
        <div className="glass-card rounded-xl p-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex-1 truncate">Link público: {shareLink}</span>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareLink); toast({ title: "Link copiado!" }); }}>
            Copiar
          </Button>
        </div>
      </div>

      {/* Google Calendar embed */}
      <div className="px-5 mb-4">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <CalIcon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">Google Calendar</span>
            </div>
            <Button size="sm" variant={showGoogle ? "default" : "outline"} onClick={() => setShowGoogle((v) => !v)}>
              {showGoogle ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
          {showGoogle && (
            <div className="rounded-lg overflow-hidden border border-border/40 bg-black">
              <iframe
                src={GOOGLE_CALENDAR_EMBED_URL}
                title="Google Calendar"
                className="w-full h-[520px]"
                style={{ border: 0 }}
                loading="lazy"
              />
              <div className="p-2 text-right">
                <a
                  href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(GOOGLE_CALENDAR_SRC)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary underline"
                >
                  Abrir no Google Calendar
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View switcher & navigation */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="flex gap-1">
          {([["month", LayoutGrid], ["week", List], ["day", Clock]] as const).map(([v, Icon]) => (
            <Button key={v} size="sm" variant={view === v ? "default" : "ghost"} onClick={() => setView(v)} className="gap-1 text-xs">
              <Icon className="w-3.5 h-3.5" />
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate("prev")}><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {view === "month" ? format(currentDate, "MMMM yyyy", { locale: ptBR }) :
             view === "week" ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}` :
             format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => navigateDate("next")}><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
        </div>
      </div>

      {/* Calendar views */}
      <div className="px-4">
        {view === "month" && (
          <div className="glass-card rounded-2xl p-3">
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((day) => {
                const dayAppts = getAppointmentsForDate(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => { setCurrentDate(day); setView("day"); }}
                    className={`relative aspect-square rounded-lg p-0.5 flex flex-col items-center justify-start transition-colors
                      ${!isSameMonth(day, currentDate) ? "opacity-30" : ""}
                      ${isToday(day) ? "bg-primary/20 border border-primary/40" : "hover:bg-accent/50"}
                      ${selectedDate && isSameDay(day, selectedDate) ? "ring-1 ring-primary" : ""}
                    `}
                  >
                    <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayAppts.slice(0, 3).map((a) => (
                          <div key={a.id} className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="glass-card rounded-2xl p-3 overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[600px]">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="space-y-1">
                  <button
                    onClick={() => { setCurrentDate(day); setView("day"); }}
                    className={`w-full text-center py-1.5 rounded-lg text-xs font-medium ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent/50"}`}
                  >
                    {format(day, "EEE dd", { locale: ptBR })}
                  </button>
                  <div className="space-y-0.5 min-h-[80px]">
                    {getAppointmentsForDate(day).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => isAdmin && openEditDialog(a)}
                        className={`w-full text-left p-1.5 rounded-md text-[10px] border ${STATUS_COLORS[a.status] || STATUS_COLORS.agendado}`}
                      >
                        <div className="font-medium truncate">{a.start_time.slice(0, 5)} {a.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "day" && (
          <div className="glass-card rounded-2xl p-3 space-y-1">
            {HOURS.map((hour) => {
              const timeStr = `${String(hour).padStart(2, "0")}:00`;
              const hourAppts = appointments.filter((a) => {
                const h = parseInt(a.start_time.split(":")[0]);
                return a.date === format(currentDate, "yyyy-MM-dd") && h === hour && a.status !== "cancelado";
              });
              return (
                <div key={hour} className="flex gap-2 min-h-[48px]">
                  <span className="text-[10px] text-muted-foreground w-10 pt-1 shrink-0">{timeStr}</span>
                  <div className="flex-1 border-t border-border/30 pt-1 space-y-0.5">
                    {hourAppts.length > 0 ? hourAppts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => isAdmin && openEditDialog(a)}
                        className={`w-full text-left p-2 rounded-lg text-xs border ${STATUS_COLORS[a.status] || STATUS_COLORS.agendado}`}
                      >
                        <div className="font-medium">{a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)} • {a.name}</div>
                        <div className="text-[10px] opacity-70">{a.unit} • {a.responsible}</div>
                      </button>
                    )) : (
                      isAdmin && (
                        <button
                          onClick={() => { openCreateDialog(currentDate); setFormStartTime(timeStr); setFormEndTime(`${String(hour + 1).padStart(2, "0")}:00`); }}
                          className="w-full h-full min-h-[36px] rounded-lg border border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming appointments list */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Próximos agendamentos</h3>
        <div className="space-y-2">
          {appointments
            .filter((a) => a.status !== "cancelado" && a.date >= format(new Date(), "yyyy-MM-dd"))
            .slice(0, 10)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => isAdmin && openEditDialog(a)}
                className="w-full glass-card rounded-xl p-3 text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{a.name}</span>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(a.date), "dd/MM/yyyy")} • {a.start_time.slice(0, 5)} - {a.end_time.slice(0, 5)} • {a.unit}
                </div>
              </button>
            ))}
          {appointments.filter((a) => a.status !== "cancelado" && a.date >= format(new Date(), "yyyy-MM-dd")).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum agendamento futuro.</p>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div><Label>Telefone *</Label><Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></div>
            <div>
              <Label>Unidade *</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Responsável *</Label><Input value={formResponsible} onChange={(e) => setFormResponsible(e.target.value)} /></div>
            <div><Label>Data *</Label><Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Início *</Label><Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} /></div>
              <div><Label>Fim *</Label><Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} /></div>
            {isAdmin && (
              <div>
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">Salvar</Button>
              {editingAppointment && isAdmin && (
                <Button variant="destructive" onClick={() => { handleDelete(editingAppointment.id); setDialogOpen(false); }}>
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Agenda;
