import { Mic, PhoneCall, CalendarCheck, Users, Handshake, ShieldAlert } from "lucide-react";
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
  onStart: (s: Scenario) => void;
}

const SimuladosPanel = ({ onStart }: Props) => {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => onStart(s)}
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
                <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-primary">
                  ▶ Iniciar simulado
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SimuladosPanel;
