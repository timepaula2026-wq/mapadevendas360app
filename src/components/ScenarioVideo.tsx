import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2, Film, SkipForward, RotateCcw, FileText, ImageIcon, CheckCircle2 } from "lucide-react";
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

type ProgressStage = "idle" | "script" | "image" | "done";

const Step = ({
  active,
  done,
  icon,
  label,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-[11px]">
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        done
          ? "bg-primary text-primary-foreground"
          : active
          ? "bg-primary/20 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
    </div>
    <span className={done || active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);

const ScenarioVideo = ({ scenarioKey, roteiro }: Props) => {
  const [data, setData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState<ProgressStage>("idle");
  const [progressMsg, setProgressMsg] = useState<string>("");
  const [imgDone, setImgDone] = useState(0);
  const [imgTotal, setImgTotal] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (roteiro) return;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + scenarioKey);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [scenarioKey, roteiro]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setStage("script");
    setProgressMsg("Escrevendo roteiro...");
    setImgDone(0);
    setImgTotal(0);
    setData(null);
    window.speechSynthesis?.cancel();
    setPlaying(false);
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
      if (!r.ok || !r.body) {
        const t = await r.text().catch(() => "");
        throw new Error(t || "Erro ao gerar vídeo");
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let working: VideoData | null = null;
      let doneImgs = 0;

      const handleEvent = (ev: any) => {
        if (ev.type === "progress") {
          if (ev.stage === "script") {
            setStage("script");
            setProgressMsg(ev.message ?? "Escrevendo roteiro...");
          } else if (ev.stage === "image") {
            setStage("image");
            setImgTotal(ev.total ?? 0);
            setProgressMsg(ev.message ?? "");
          }
        } else if (ev.type === "script") {
          working = {
            title: ev.title,
            scenes: (ev.scenes ?? []).map((s: any) => ({
              title: s.title,
              narration: s.narration,
              imageUrl: null,
            })),
          };
          setData(working);
          setIdx(0);
        } else if (ev.type === "image") {
          if (working && working.scenes[ev.index]) {
            working.scenes[ev.index].imageUrl = ev.imageUrl;
            setData({ ...working, scenes: [...working.scenes] });
          }
          doneImgs += 1;
          setImgDone(doneImgs);
        } else if (ev.type === "done") {
          working = ev.video;
          setData(ev.video);
          setStage("done");
          if (!roteiro) {
            try { localStorage.setItem(STORAGE_PREFIX + scenarioKey, JSON.stringify(ev.video)); } catch {}
          }
        } else if (ev.type === "error") {
          throw new Error(ev.error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try { handleEvent(JSON.parse(line)); } catch (e) { console.error("parse", line, e); }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setStage("idle");
    } finally {
      setLoading(false);
    }
  };

  const playScene = (i: number) => {
    if (!data || !data.scenes[i] || loading) return;
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
    if (!data || loading) return;
    if (playing) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      playScene(idx);
    }
  };

  const restart = () => {
    if (loading) return;
    window.speechSynthesis?.cancel();
    playScene(0);
  };

  const ProgressPanel = () => (
    <div className="space-y-2">
      <Step
        active={stage === "script"}
        done={stage === "image" || stage === "done"}
        icon={<FileText className="w-3 h-3" />}
        label="Roteiro"
      />
      <Step
        active={stage === "image"}
        done={stage === "done"}
        icon={<ImageIcon className="w-3 h-3" />}
        label={
          stage === "image" || stage === "done"
            ? `Cenas (${Math.min(imgDone, imgTotal || 3)}/${imgTotal || 3})`
            : "Cenas"
        }
      />
      {imgTotal > 0 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.round((imgDone / imgTotal) * 100)}%` }}
          />
        </div>
      )}
      {progressMsg && <p className="text-[10px] text-muted-foreground">{progressMsg}</p>}
    </div>
  );

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
        {loading && <div className="mt-3"><ProgressPanel /></div>}
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
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-[10px]">Gerando imagem...</span>
              </>
            ) : (
              <Film className="w-10 h-10" />
            )}
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
        {loading && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur text-foreground px-2 py-0.5 rounded-full text-[10px]">
            <Loader2 className="w-3 h-3 animate-spin" /> Gerando...
          </div>
        )}
      </div>
      {loading && <div className="px-3 pt-2"><ProgressPanel /></div>}
      <div className="flex items-center gap-1 p-2">
        <button
          onClick={togglePlay}
          disabled={loading}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          title={playing ? "Pausar" : "Tocar"}
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={restart}
          disabled={loading}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
          title="Reiniciar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 flex gap-1">
          {data.scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => playScene(i)}
              disabled={loading}
              className={`flex-1 h-1.5 rounded-full transition-colors disabled:opacity-50 ${
                i === idx ? "bg-primary" : "bg-muted hover:bg-muted-foreground/30"
              }`}
              title={`Cena ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => playScene(Math.min(idx + 1, data.scenes.length - 1))}
          disabled={loading || idx >= data.scenes.length - 1}
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
