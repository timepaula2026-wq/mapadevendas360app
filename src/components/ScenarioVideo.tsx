import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2, Film, SkipForward, RotateCcw } from "lucide-react";
import { ScenarioKey } from "./SimuladosPanel";

interface Scene {
  title: string;
  narration: string;
  imageUrl: string | null;
}
interface VideoData {
  title: string;
  scenes: Scene[];
}

interface Props {
  scenarioKey: ScenarioKey;
  roteiro?: string;
}

const STORAGE_PREFIX = "vendedorIa_video_";

const ScenarioVideo = ({ scenarioKey, roteiro }: Props) => {
  const [data, setData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load cached on mount (only when no roteiro to keep it deterministic)
  useEffect(() => {
    if (roteiro) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + scenarioKey);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [scenarioKey, roteiro]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scenario-video`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ scenario: scenarioKey, roteiro }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erro ao gerar vídeo");
      setData(d);
      setIdx(0);
      if (!roteiro) {
        try { localStorage.setItem(STORAGE_PREFIX + scenarioKey, JSON.stringify(d)); } catch {}
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const playScene = (i: number) => {
    if (!data || !data.scenes[i]) return;
    window.speechSynthesis?.cancel();
    setIdx(i);
    const u = new SpeechSynthesisUtterance(data.scenes[i].narration);
    u.lang = "pt-BR";
    u.rate = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const pt = voices.find((v) => v.lang?.startsWith("pt"));
    if (pt) u.voice = pt;
    u.onend = () => {
      if (i + 1 < (data?.scenes.length ?? 0)) {
        playScene(i + 1);
      } else {
        setPlaying(false);
      }
    };
    u.onerror = () => setPlaying(false);
    utterRef.current = u;
    setPlaying(true);
    window.speechSynthesis.speak(u);
  };

  const togglePlay = () => {
    if (!data) return;
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      playScene(idx);
    }
  };

  const restart = () => {
    window.speechSynthesis?.cancel();
    playScene(0);
  };

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shrink-0">
            <Film className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">Vídeo do cenário</p>
            <p className="text-[10px] text-muted-foreground">
              IA monta roteiro + storyboard com narração
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {loading ? "Gerando..." : "Gerar vídeo"}
          </button>
        </div>
        {error && <p className="text-[10px] text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  const cur = data.scenes[idx];
  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card mb-3">
      <div className="relative aspect-video bg-muted">
        {cur?.imageUrl ? (
          <img src={cur.imageUrl} alt={cur.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Film className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Cena {idx + 1}/{data.scenes.length} · {cur?.title}
          </p>
          <p className="text-xs text-foreground mt-1 line-clamp-3">{cur?.narration}</p>
        </div>
        {playing && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded-full text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /> Tocando
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 p-2">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90"
          title={playing ? "Pausar" : "Tocar"}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={restart}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground"
          title="Reiniciar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 flex gap-1">
          {data.scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => playScene(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i === idx ? "bg-primary" : "bg-muted hover:bg-muted-foreground/30"
              }`}
              title={`Cena ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => playScene(Math.min(idx + 1, data.scenes.length - 1))}
          disabled={idx >= data.scenes.length - 1}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30"
          title="Próxima cena"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={generate}
          disabled={loading}
          className="text-[10px] text-muted-foreground hover:text-foreground px-2"
          title="Regerar"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "↻"}
        </button>
      </div>
    </div>
  );
};

export default ScenarioVideo;