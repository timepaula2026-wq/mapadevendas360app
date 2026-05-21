import { Mic, PhoneCall, CalendarCheck, Users, Handshake, ShieldAlert, FileText, X, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { extractPdfText } from "@/lib/pdfText";
import simProspeccao from "@/assets/sim-prospeccao.jpg";
import simAgendamento from "@/assets/sim-agendamento.jpg";
import simReuniao from "@/assets/sim-reuniao.jpg";
import simFechamento from "@/assets/sim-fechamento.jpg";
import simObjecoes from "@/assets/sim-objecoes.jpg";

export type ScenarioKey = "prospeccao" | "agendamento" | "reuniao" | "fechamento" | "objecoes";

export interface Scenario {
  key: ScenarioKey;
  title: string;
  subtitle: string;
  image: string;
  icon: typeof PhoneCall;
  opener: string;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "prospeccao",
    title: "Prospecção",
    subtitle: "Cold call inicial — quebre o gelo",
    image: simProspeccao,
    icon: PhoneCall,
    opener: "Alô? Quem fala? Olha, eu tô meio ocupado agora...",
  },
  {
    key: "agendamento",
    title: "Agendamento",
    subtitle: "Marque a reunião sem ser ignorado",
    image: simAgendamento,
    icon: CalendarCheck,
    opener: "Pode até ser interessante, mas por que eu preciso de uma reunião? Não dá pra mandar tudo por WhatsApp?",
  },
  {
    key: "reuniao",
    title: "Reunião de Apresentação",
    subtitle: "Conduza uma reunião de consórcio",
    image: simReuniao,
    icon: Users,
    opener: "Tô aqui pra entender melhor esse tal de consórcio. Tô pensando num imóvel de uns R$ 300 mil. Como funciona?",
  },
  {
    key: "fechamento",
    title: "Fechamento",
    subtitle: "Quebre as últimas resistências",
    image: simFechamento,
    icon: Handshake,
    opener: "Eu gostei, mas deixa eu pensar com calma. Preciso conversar com minha esposa antes de assinar.",
  },
  {
    key: "objecoes",
    title: "Treino de Objeções",
    subtitle: "5 objeções fortes em sequência",
    image: simObjecoes,
    icon: ShieldAlert,
    opener: "Pra mim consórcio é furada. Posso pagar 10 anos e não ser contemplado nunca. Me convence do contrário.",
  },
];

interface Props {
  onStart: (s: Scenario, roteiro?: { name: string; text: string }) => void;
}

const SimuladosPanel = ({ onStart }: Props) => {
  const [roteiro, setRoteiro] = useState<{ name: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Envie um arquivo PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF muito grande (máx 10MB)");
      return;
    }
    setLoading(true);
    try {
      const text = await extractPdfText(file);
      if (!text) {
        toast.error("Não foi possível extrair texto do PDF");
        return;
      }
      setRoteiro({ name: file.name, text });
      toast.success("Roteiro carregado — será usado nos cenários");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao ler PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-1 py-3">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-gold mb-2">
          <Mic className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Simulados de Vendas</h2>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
          Treine cenários reais com cliente IA. Use voz, texto, áudio ou vídeo. A IA dá feedback ao final.
        </p>
      </div>

      {/* Roteiro / PDF */}
      <div className="mb-4 rounded-xl border border-dashed border-border bg-card/50 p-3">
        {roteiro ? (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{roteiro.name}</p>
              <p className="text-[10px] text-muted-foreground">
                Roteiro ativo · {roteiro.text.length.toLocaleString()} caracteres
              </p>
            </div>
            <button
              onClick={() => setRoteiro(null)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              title="Remover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="flex-1">
              {loading ? "Lendo PDF..." : "Carregar PDF/roteiro (será base dos cenários)"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={loading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const supports = s.key === "prospeccao" || s.key === "objecoes";
          return (
            <button
              key={s.key}
              onClick={() => onStart(s, supports ? roteiro ?? undefined : undefined)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left hover:border-primary transition-all active:scale-[0.98]"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  width={1024}
                  height={576}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground rounded-full p-1.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{s.subtitle}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                    ▶ Iniciar simulado
                  </span>
                  {supports && roteiro && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary/80">
                      <FileText className="w-3 h-3" /> roteiro
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SimuladosPanel;
