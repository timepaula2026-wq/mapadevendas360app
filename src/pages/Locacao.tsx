import { useState, useEffect } from "react";
import { ArrowLeft, CalendarDays, Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import type { DateRange } from "react-day-picker";

interface RentalItem {
  id: string;
  name: string;
  description: string | null;
  daily_price: number;
  image_url: string | null;
  category: string | null;
}

interface Rental {
  id: string;
  rental_item_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const Locacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<RentalItem[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsRes, rentalsRes] = await Promise.all([
      supabase.from("rental_items").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("rentals").select("*").eq("status", "confirmed"),
    ]);
    setItems((itemsRes.data as RentalItem[]) || []);
    setRentals((rentalsRes.data as Rental[]) || []);
    setLoading(false);
  };

  const getBookedDates = (itemId: string): Date[] => {
    const dates: Date[] = [];
    rentals
      .filter((r) => r.rental_item_id === itemId)
      .forEach((r) => {
        const interval = eachDayOfInterval({
          start: parseISO(r.start_date),
          end: parseISO(r.end_date),
        });
        dates.push(...interval);
      });
    return dates;
  };

  const handleBook = async () => {
    if (!user || !selectedItem || !dateRange?.from || !dateRange?.to) return;

    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const total = days * selectedItem.daily_price;

    const { error } = await supabase.from("rentals").insert({
      user_id: user.id,
      rental_item_id: selectedItem.id,
      start_date: format(dateRange.from, "yyyy-MM-dd"),
      end_date: format(dateRange.to, "yyyy-MM-dd"),
      total,
      status: "confirmed",
    });

    if (error) {
      toast.error("Erro ao reservar");
      return;
    }

    toast.success("Reserva confirmada!");
    setSelectedItem(null);
    setDateRange(undefined);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Locação de Materiais</h1>
          <p className="text-xs text-muted-foreground">Agende a data de locação</p>
        </div>
      </header>

      {selectedItem ? (
        <div className="p-4 space-y-4">
          <button onClick={() => setSelectedItem(null)} className="text-xs text-primary hover:underline">
            ← Voltar aos materiais
          </button>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt={selectedItem.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-sm font-bold text-foreground">{selectedItem.name}</h2>
                <p className="text-xs text-primary font-semibold">R$ {selectedItem.daily_price.toFixed(2)}/dia</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Selecione o período de locação. Datas em vermelho já estão reservadas.
            </p>

            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={[
                  { before: new Date() },
                  ...getBookedDates(selectedItem.id).map((d) => d),
                ]}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
                modifiers={{
                  booked: getBookedDates(selectedItem.id),
                }}
                modifiersClassNames={{
                  booked: "!bg-destructive/20 !text-destructive line-through",
                }}
              />
            </div>

            {dateRange?.from && dateRange?.to && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Período</span>
                  <span>
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-foreground">
                  <span>Total</span>
                  <span>
                    R$ {((differenceInDays(dateRange.to, dateRange.from) + 1) * selectedItem.daily_price).toFixed(2)}
                  </span>
                </div>
                <Button onClick={handleBook} className="w-full mt-2">
                  Confirmar Reserva
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          {items.map((item) => {
            const bookedCount = rentals.filter((r) => r.rental_item_id === item.id).length;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-card border border-border rounded-xl overflow-hidden text-left hover:border-primary/30 transition-colors"
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-secondary flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-2">{item.name}</h3>
                  <p className="text-sm font-bold text-primary">R$ {item.daily_price.toFixed(2)}/dia</p>
                  {bookedCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CalendarDays className="w-3 h-3" /> {bookedCount} reserva(s)
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum material disponível</p>
            </div>
          )}
        </div>
      )}
      <BottomNav activeTab="home" onTabChange={() => navigate("/")} />
    </div>
  );
};

export default Locacao;
