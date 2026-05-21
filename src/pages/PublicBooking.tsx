import { useState, useEffect, useMemo } from "react";
import { CalendarDays, Clock, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { format, addMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isBefore, isToday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const UNITS = ["Araucária", "Araçatuba", "Almirante Tamandaré", "Colombo", "Paranaguá", "Palácio do café", "Praça do Japão", "Pinheiros", "Poços de Caldas", "São João da Boa Vista", "Digital"];

const TIME_SLOTS = Array.from({ length: 26 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const min = i % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${min}`;
}).filter((t) => t <= "19:30");

const PublicBooking = () => {
  const [step, setStep] = useState(0); // 0=unit, 1=date, 2=time, 3=form, 4=done
  const [unit, setUnit] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<{ date: string; start_time: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch booked slots for selected unit
  useEffect(() => {
    if (!unit) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("date, start_time")
        .eq("unit", unit)
        .neq("status", "cancelado");
      if (data) setBookedSlots(data);
    };
    fetch();
  }, [unit]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const booked = bookedSlots.filter((s) => s.date === dateStr).map((s) => s.start_time.slice(0, 5));
    return TIME_SLOTS.filter((t) => !booked.includes(t));
  }, [selectedDate, bookedSlots]);

  const handleSubmit = async () => {
    if (!name || !phone || !selectedDate || !selectedTime || !unit) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const [h, m] = selectedTime.split(":").map(Number);
    const endH = m === 30 ? h + 1 : h;
    const endM = m === 30 ? "00" : "30";
    const endTime = `${String(endH).padStart(2, "0")}:${endM}`;

    const { error } = await supabase.from("appointments").insert({
      name, phone, email: email || null, unit,
      responsible: "A definir",
      date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedTime,
      end_time: endTime,
      notes: notes || null,
      status: "agendado",
    });

    setSubmitting(false);

    if (error) {
      if (error.message.includes("idx_no_double_booking")) {
        toast({ title: "Horário indisponível", description: "Este horário acabou de ser reservado. Escolha outro.", variant: "destructive" });
      } else {
        toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      }
      return;
    }

    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />
      {/* Header */}
      <header className="px-5 pt-10 pb-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl gradient-gold flex items-center justify-center mb-3">
          <CalendarDays className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gradient-gold">Agendar Horário</h1>
        <p className="text-sm text-muted-foreground mt-1">Selecione a unidade, data e horário desejados</p>
      </header>

      {/* Steps indicator */}
      <div className="px-8 mb-6">
        <div className="flex items-center justify-between">
          {["Unidade", "Data", "Horário", "Dados"].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {step > i ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-10">
        {/* Step 0: Select unit */}
        {step === 0 && (
          <div className="space-y-3 animate-fade-up">
            <h2 className="text-lg font-semibold text-foreground">Selecione a unidade</h2>
            <div className="grid grid-cols-2 gap-2">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => { setUnit(u); setStep(1); }}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all text-left
                    ${unit === u ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Select date */}
        {step === 1 && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep(0)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">Selecione o dia</h2>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}><ArrowLeft className="w-4 h-4 text-muted-foreground" /></button>
                <span className="text-sm font-medium text-foreground capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ArrowRight className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day) => {
                  const past = isBefore(day, new Date()) && !isToday(day);
                  const weekend = day.getDay() === 0;
                  const disabled = past || weekend || !isSameMonth(day, currentMonth);
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={disabled}
                      onClick={() => { setSelectedDate(day); setStep(2); }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors
                        ${disabled ? "opacity-20 cursor-not-allowed" : "hover:bg-primary/20 cursor-pointer"}
                        ${isToday(day) ? "bg-primary/10 text-primary border border-primary/30" : "text-foreground"}
                        ${selectedDate && isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select time */}
        {step === 2 && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">
                Horários em {selectedDate ? format(selectedDate, "dd/MM", { locale: ptBR }) : ""}
              </h2>
            </div>
            {availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum horário disponível neste dia.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSelectedTime(t); setStep(3); }}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all
                      ${selectedTime === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                  >
                    <Clock className="w-3.5 h-3.5 inline mr-1" />{t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Fill data */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setStep(2)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-foreground">Seus dados</h2>
            </div>

            <div className="glass-card rounded-2xl p-3 text-xs text-muted-foreground flex gap-4">
              <span>📍 {unit}</span>
              <span>📅 {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}</span>
              <span>🕐 {selectedTime}</span>
            </div>

            <div className="space-y-3">
              <div><Label>Nome completo *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" /></div>
              <div><Label>Telefone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" /></div>
              <div><Label>Observação</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo que gostaria de informar?" /></div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center py-12 animate-fade-up space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Agendamento Confirmado!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Seu horário foi reservado com sucesso. Em breve entraremos em contato para confirmar.
            </p>
            <div className="glass-card rounded-2xl p-4 text-left mx-auto max-w-xs">
              <p className="text-xs text-muted-foreground">📍 {unit}</p>
              <p className="text-xs text-muted-foreground">📅 {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}</p>
              <p className="text-xs text-muted-foreground">🕐 {selectedTime}</p>
              <p className="text-xs text-muted-foreground">👤 {name}</p>
            </div>
            <Button variant="outline" onClick={() => { setStep(0); setName(""); setPhone(""); setEmail(""); setNotes(""); setSelectedDate(null); setSelectedTime(""); }}>
              Fazer outro agendamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicBooking;
