import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Bot, User, Loader2, ImageIcon, MessageSquare, Mic, MicOff, Volume2, VolumeX, X, Sparkles, Settings2, Square, Play, Lock, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import SimuladosPanel, { Scenario, ScenarioKey } from "@/components/SimuladosPanel";
import ScenarioVideo from "@/components/ScenarioVideo";
import ContentViewerModal from "@/components/ContentViewerModal";
import { supabase } from "@/integrations/supabase/client";
import { AI_ENABLED, requireAi } from "@/lib/aiAccess";
import { FAQ_CATEGORIES, answerFromFaq, buildTurns, buildFeedback, Turn } from "@/lib/iaOffline";
import { localSearch, LocalHit } from "@/lib/localSearch";

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ademicon`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-creative`;

const authHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };
};

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  scenario,
  roteiro,
  signal,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  scenario?: ScenarioKey;
  roteiro?: string;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        messages: messages.map(({ role, content }) => ({ role, content })),
        scenario,
        roteiro,
      }),
      signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      onError(data.error || "Erro ao conectar com a IA");
      return;
    }
    if (!resp.body) { onError("Sem resposta"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) onDelta(c);
        } catch {
          buf = line + "\n" + buf;
          break;
        }
      }
    }
    onDone();
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    onError("Sem conexão com a internet. Tente de novo.");
  }
}

async function generateCreativeImage(prompt: string): Promise<{ imageUrl: string; text: string }> {
  const resp = await fetch(IMAGE_URL, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ prompt }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao gerar imagem");
  }

  return resp.json();
}

const IMAGE_SUGGESTIONS = [
  "Post para Instagram de carta de crédito de imóvel R$300mil",
  "Story promocional de consórcio de automóvel",
  "Banner para carta contemplada com lance embutido",
  "Post de oportunidade de investimento via consórcio",
];

const inferViewerType = (h: LocalHit) => {
  if (h.youtube_id) return "youtube";
  const clean = (h.url || "").split(/[?#]/)[0].toLowerCase();
  if (h.type === "document" || h.type === "pdf" || clean.endsWith(".pdf")) return "pdf";
  return h.type || "link";
};

type ChatMode = "chat" | "image" | "simulados";

const ChatBot = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Página unificada "IA do Consórcio" com abas internas: Pergunte IA / Vendedor IA
  const initialTab = (searchParams.get("mode") === "ask" ? "ask" : "sell") as "ask" | "sell";
  const [iaTab, setIaTab] = useState<"ask" | "sell">(initialTab);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [mode, setMode] = useState<ChatMode>(initialTab === "ask" ? "chat" : "simulados");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [roteiro, setRoteiro] = useState<{ name: string; text: string } | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [rate, setRate] = useState(1.02);
  const [volume, setVolume] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [viewer, setViewer] = useState<LocalHit | null>(null);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>([]);
  const sessionRef = useRef(0); // muda a cada troca de aba/cenário — ignora respostas antigas
  const abortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const stepRef = useRef(0);
  const answersRef = useRef<string[]>([]);
  const hitsRef = useRef<Record<string, LocalHit>>({});

  useEffect(() => {
    messagesRef.current = messages;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Para a voz e a conexão ao sair da página
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop?.();
      abortRef.current?.abort();
    };
  }, []);

  const resetConversation = () => {
    sessionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    window.speechSynthesis?.cancel();
    setLoading(false);
    setMessages([]);
  };

  const speak = (text: string, index?: number) => {
    if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[#*_`>|]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").slice(0, 600);
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "pt-BR";
      u.rate = rate;
      u.pitch = 1;
      u.volume = volume;
      const voices = window.speechSynthesis.getVoices();
      const pt = voices.find((v) => v.lang?.startsWith("pt"));
      if (pt) u.voice = pt;
      u.onstart = () => { setSpeaking(true); if (typeof index === "number") setSpeakingIndex(index); };
      u.onend = () => { setSpeaking(false); setSpeakingIndex(null); };
      u.onerror = () => { setSpeaking(false); setSpeakingIndex(null); };
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setSpeakingIndex(null);
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Reconhecimento de voz não suportado neste navegador");
      return;
    }
    try {
      const r = new SR();
      r.lang = "pt-BR";
      r.interimResults = false;
      r.continuous = false;
      r.onstart = () => setListening(true);
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      r.onresult = (e: any) => {
        const text = Array.from(e.results).map((res: any) => res[0].transcript).join(" ").trim();
        if (text) setTimeout(() => sendRef.current(text), 50);
      };
      recognitionRef.current = r;
      r.start();
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
  };

  const startScenario = (s: Scenario, r?: { name: string; text: string }) => {
    resetConversation();
    setScenario(s);
    setRoteiro(r ?? null);
    setScenarioDone(false);
    setMode("chat");
    turnsRef.current = buildTurns(s.key, s.opener, r?.text);
    stepRef.current = 0;
    answersRef.current = [];
    const extra = turnsRef.current.length - buildTurns(s.key, s.opener).length;
    const opener: Msg = {
      role: "assistant",
      content:
        `🎬 **${s.title}** — Cliente iniciando...` +
        (r ? `\n\n📄 _Roteiro: ${r.name}${!AI_ENABLED && extra > 0 ? ` (${extra} pergunta${extra > 1 ? "s" : ""} do roteiro no simulado)` : ""}_` : "") +
        `\n\n_${s.opener}_`,
    };
    setMessages([opener]);
    setTimeout(() => speak(s.opener, 0), 200);
  };

  const exitScenario = () => {
    resetConversation();
    setScenario(null);
    setRoteiro(null);
    setScenarioDone(false);
    setMode("simulados");
  };

  /* ---------------- Modo gratuito (sem IA paga) ---------------- */

  const offlineScenarioReply = (text: string) => {
    if (!scenario) return;
    answersRef.current.push(text);
    stepRef.current += 1;
    const turns = turnsRef.current;
    if (stepRef.current < turns.length) {
      const line = turns[stepRef.current].text;
      setMessages((prev) => [...prev, { role: "assistant", content: line }]);
      setTimeout(() => speak(line, messagesRef.current.length - 1), 150);
    } else {
      const fb = buildFeedback(scenario.key, answersRef.current, turns);
      setMessages((prev) => [...prev, { role: "assistant", content: fb }]);
      setScenarioDone(true);
      speak("Simulado concluído! Confira seu feedback.");
    }
  };

  const offlineAnswer = async (text: string): Promise<string> => {
    const faq = await answerFromFaq(text).catch(() => null);
    const hits = await localSearch(text, 6).catch(() => [] as LocalHit[]);
    if (faq) {
      // resposta pronta + materiais do app relacionados
      const related = hits.filter((h) => h.kind === "content" && h.score >= 3).slice(0, 3);
      related.forEach((h) => { hitsRef.current[h.id] = h; });
      return related.length
        ? `${faq}\n\n**📚 Materiais no app:**\n${related.map((h) => `- 📄 [${h.title}](#open:${h.id}) — _${h.subtitle}_`).join("\n")}`
        : faq;
    }
    if (hits.length) {
      hits.forEach((h) => { hitsRef.current[h.id] = h; });
      return (
        "Encontrei isto no app:\n\n" +
        hits
          .map((h) =>
            h.kind === "content"
              ? `- 📄 [${h.title}](#open:${h.id}) — _${h.subtitle}_`
              : `- 📂 [${h.title}](${h.route}) — _${h.subtitle}_`,
          )
          .join("\n")
      );
    }
    return (
      "Não tenho uma resposta pronta para isso. 🙏\n\n" +
      "No modo gratuito eu respondo as **perguntas frequentes** (atalhos da tela inicial do chat) e encontro **materiais do app**. " +
      "Tente palavras-chave, como *lance*, *carreira* ou *apresentação*.\n\n" +
      "🔒 _Respostas livres para qualquer pergunta são exclusivas para assinantes._"
    );
  };

  /* ---------------- Envio ---------------- */

  const sendText = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    if (scenario && scenarioDone) return;

    // Criativos com IA (gerar imagem) — só para assinantes
    const plain = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
    const wantsImage =
      !scenario &&
      iaTab === "sell" &&
      (mode === "image" ||
        (/\b(gere|gerar|crie|criar|faca|fazer|monte|montar)\b/i.test(plain) &&
          /\b(imagem|criativo|banner|story|arte)\b/i.test(plain)));
    if (wantsImage) {
      if (!requireAi()) return;
      setInput("");
      return sendImage(text);
    }

    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    if (!AI_ENABLED) {
      if (scenario) {
        offlineScenarioReply(text);
        return;
      }
      setLoading(true);
      const session = sessionRef.current;
      const answer = await offlineAnswer(text);
      if (session !== sessionRef.current) return;
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setLoading(false);
      return;
    }

    // ---- Com IA (assinantes) ----
    setLoading(true);
    const session = sessionRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      if (session !== sessionRef.current) return;
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev[prev.length - 2] === userMsg) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };
    await streamChat({
      messages: [...messagesRef.current.filter((m) => m !== userMsg), userMsg],
      onDelta: upsert,
      onDone: () => {
        if (session !== sessionRef.current) return;
        setLoading(false);
        if (scenario && assistantSoFar) speak(assistantSoFar, messagesRef.current.length - 1);
      },
      scenario: scenario?.key,
      roteiro: roteiro?.text,
      signal: controller.signal,
      onError: (msg) => {
        if (session !== sessionRef.current) return;
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
        setLoading(false);
      },
    });
  };

  const sendRef = useRef(sendText);
  sendRef.current = sendText;

  const sendImage = async (text: string) => {
    const userMsg: Msg = { role: "user", content: `🎨 ${text}` };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    const session = sessionRef.current;

    try {
      const { imageUrl, text: description } = await generateCreativeImage(text);
      if (session !== sessionRef.current) return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: description || "Aqui está seu criativo! 🎨", imageUrl },
      ]);
    } catch (e) {
      if (session !== sessionRef.current) return;
      const msg = e instanceof Error ? e.message : "Erro ao gerar imagem";
      toast.error(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
    } finally {
      if (session === sessionRef.current) setLoading(false);
    }
  };

  const restartScenario = () => {
    if (scenario) startScenario(scenario, roteiro ?? undefined);
  };

  const MarkdownLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    if (href?.startsWith("#open:")) {
      const hit = hitsRef.current[href.slice(6)];
      return (
        <button type="button" onClick={() => hit && setViewer(hit)} className="text-primary underline underline-offset-2 text-left">
          {children}
        </button>
      );
    }
    if (href?.startsWith("/")) {
      return (
        <button type="button" onClick={() => navigate(href)} className="text-primary underline underline-offset-2 text-left">
          {children}
        </button>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
        {children}
      </a>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-10 sm:pt-4 pb-3 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => (scenario ? exitScenario() : navigate("/"))} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">
              {scenario ? `🎬 ${scenario.title}` : "IA do Consórcio"}
            </h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {scenario ? (scenarioDone ? "Simulado concluído" : "Simulado em andamento — fale ou digite") :
                iaTab === "ask" ? "Pergunte IA — tire dúvidas sobre consórcio e o app" :
                "Vendedor IA — treine vendas em cenários reais"}
            </p>
          </div>
        </div>
        {scenario && (
          <button
            onClick={() => setVoiceOn((v) => !v)}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
            title={voiceOn ? "Silenciar voz" : "Ativar voz"}
          >
            {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}
        {scenario && (
          <button
            onClick={stopSpeaking}
            disabled={!speaking}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
            title="Parar fala"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
        {scenario && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1.5 rounded-full text-muted-foreground hover:text-foreground" title="Ajustes de voz">
                <Settings2 className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-4" align="end">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Velocidade</span>
                  <span className="font-medium">{rate.toFixed(2)}x</span>
                </div>
                <Slider value={[rate]} min={0.5} max={2} step={0.05} onValueChange={(v) => setRate(v[0])} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{Math.round(volume * 100)}%</span>
                </div>
                <Slider value={[volume]} min={0} max={1} step={0.05} onValueChange={(v) => setVolume(v[0])} />
              </div>
            </PopoverContent>
          </Popover>
        )}
        {scenario && (
          <button onClick={exitScenario} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground" title="Encerrar simulado">
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Mode toggle */}
        {!scenario && iaTab === "sell" && (
        <div className="flex gap-1 bg-secondary rounded-full p-0.5">
          <button
            onClick={() => { resetConversation(); setMode("chat"); }}
            className={`p-1.5 rounded-full transition-colors ${
              mode === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => { resetConversation(); setMode("image"); }}
            className={`p-1.5 rounded-full transition-colors relative ${
              mode === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title={AI_ENABLED ? "Gerar Imagem" : "Gerar Imagem (assinantes)"}
          >
            <ImageIcon className="w-4 h-4" />
            {!AI_ENABLED && <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5" />}
          </button>
          <button
            onClick={() => { resetConversation(); setMode("simulados"); }}
            className={`p-1.5 rounded-full transition-colors ${
              mode === "simulados" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Simulados"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        )}
      </header>

      {/* Abas: Pergunte IA / Vendedor IA */}
      {!scenario && (
        <div className="flex border-b border-border bg-card/60 backdrop-blur-sm shrink-0">
          <button
            onClick={() => { resetConversation(); setIaTab("ask"); setMode("chat"); }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              iaTab === "ask" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            💬 Pergunte IA
          </button>
          <button
            onClick={() => { resetConversation(); setIaTab("sell"); setMode("simulados"); }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
              iaTab === "sell" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🎯 Vendedor IA
          </button>
        </div>
      )}

      {!AI_ENABLED && !scenario && messages.length === 0 && (
        <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-border bg-card/60 px-3 py-2 shrink-0">
          <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground">Modo gratuito:</span> perguntas frequentes, busca nos materiais do app e
            simulados com feedback automático. Respostas livres, criativos com IA e feedback personalizado são para assinantes.
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="max-w-3xl mx-auto">
        {scenario && <ScenarioVideo scenarioKey={scenario.key} roteiro={roteiro?.text} />}
        {messages.length === 0 && mode === "simulados" && !scenario && <SimuladosPanel onStart={startScenario} />}

        {messages.length === 0 && mode === "chat" && !scenario && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-glow">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Olá! 👋</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Sou o assistente do Mapa de Vendas. Pergunte sobre consórcio, vendas, carreira ou onde encontrar algo no app!
            </p>
            <div className="flex gap-2 mt-3 justify-center flex-wrap">
              {FAQ_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(i)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeCategory === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center max-w-sm">
              {FAQ_CATEGORIES[activeCategory].questions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && mode === "image" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-glow">
              {AI_ENABLED ? <ImageIcon className="w-8 h-8 text-primary-foreground" /> : <Lock className="w-8 h-8 text-primary-foreground" />}
            </div>
            <h2 className="text-lg font-bold text-foreground">Criativos de Vendas 🎨</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {AI_ENABLED
                ? "Descreva o criativo que deseja e a IA vai gerar uma imagem profissional para suas vendas de carta de crédito!"
                : "Gerar imagens com IA é exclusivo para assinantes. Você precisa assinar para usar esse recurso."}
            </p>
            {AI_ENABLED && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center max-w-sm">
              {IMAGE_SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <Avatar className={`w-7 h-7 mt-1 shrink-0 ${speakingIndex === i ? "ring-2 ring-primary animate-pulse" : ""}`}>
                <AvatarFallback className="gradient-gold text-primary-foreground text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              } ${speakingIndex === i ? "ring-1 ring-primary/50" : ""}`}
            >
              {msg.imageUrl && (
                <div className="mb-2">
                  <img src={msg.imageUrl} alt="Criativo gerado" className="rounded-xl max-w-full w-full" loading="lazy" />
                  <a href={msg.imageUrl} download="criativo-ademicon.png" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                    📥 Baixar imagem
                  </a>
                </div>
              )}
              {msg.role === "assistant" && !msg.imageUrl ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                  <ReactMarkdown components={{ a: MarkdownLink as any }}>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                !msg.imageUrl && msg.content
              )}
              {msg.imageUrl && msg.content && <p className="mt-1 text-xs text-muted-foreground">{msg.content}</p>}
              {scenario && msg.role === "assistant" && !msg.imageUrl && (
                <div className="mt-1.5 flex items-center gap-2">
                  {speakingIndex === i ? (
                    <button onClick={stopSpeaking} className="inline-flex items-center gap-1 text-[10px] text-primary">
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-0.5 bg-primary animate-[pulse_0.8s_ease-in-out_infinite] h-2" />
                        <span className="w-0.5 bg-primary animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                        <span className="w-0.5 bg-primary animate-[pulse_1s_ease-in-out_infinite] h-1.5" />
                      </span>
                      Tocando — parar
                    </button>
                  ) : (
                    <button
                      onClick={() => speak(msg.content, i)}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
                      title="Reproduzir voz"
                    >
                      <Play className="w-3 h-3" /> Ouvir
                    </button>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <Avatar className="w-7 h-7 mt-1 shrink-0">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  <User className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2 mb-3">
            <Avatar className="w-7 h-7 mt-1 shrink-0">
              <AvatarFallback className="gradient-gold text-primary-foreground text-xs">
                <Bot className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{mode === "image" ? "Gerando criativo..." : "Pensando..."}</span>
              </div>
            </div>
          </div>
        )}

        {scenario && scenarioDone && (
          <div className="flex justify-center gap-2 my-4">
            <Button size="sm" variant="secondary" className="gap-1.5 rounded-full" onClick={restartScenario}>
              <RotateCcw className="w-3.5 h-3.5" /> Refazer simulado
            </Button>
            <Button size="sm" className="gap-1.5 rounded-full" onClick={exitScenario}>
              Outros cenários
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      {(mode !== "simulados" || scenario) && !(scenario && scenarioDone) && (
      <div className="p-3 border-t border-border bg-card/80 backdrop-blur-lg">
        <form onSubmit={(e) => { e.preventDefault(); sendText(input); }} className="flex gap-2 max-w-3xl mx-auto">
          <Button
            type="button"
            size="icon"
            variant={listening ? "destructive" : "secondary"}
            className="rounded-full shrink-0"
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={loading || (mode === "image" && !AI_ENABLED)}
            title={listening ? "Parar" : "Falar"}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              scenario ? "Responda como vendedor (texto ou 🎤)..." :
              mode === "image" ? (AI_ENABLED ? "Descreva o criativo que deseja..." : "🔒 Exclusivo para assinantes") :
              "Digite sua pergunta..."
            }
            className="flex-1 bg-secondary border-border rounded-full text-sm"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={loading || !input.trim()}>
            {mode === "image" && !scenario ? <ImageIcon className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
      )}

      {viewer && (
        <ContentViewerModal
          open={!!viewer}
          onClose={() => setViewer(null)}
          title={viewer.title}
          type={inferViewerType(viewer)}
          url={viewer.url || (viewer.youtube_id ? `https://www.youtube.com/watch?v=${viewer.youtube_id}` : null)}
          youtubeId={viewer.youtube_id || null}
        />
      )}
    </div>
  );
};

export default ChatBot;
