import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Bot, User, Loader2, ImageIcon, MessageSquare, Mic, MicOff, Volume2, VolumeX, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import SimuladosPanel, { SCENARIOS, Scenario, ScenarioKey } from "@/components/SimuladosPanel";

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ademicon`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-creative`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  scenario,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  scenario?: ScenarioKey;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      scenario,
    }),
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
}

async function generateCreativeImage(prompt: string): Promise<{ imageUrl: string; text: string }> {
  const resp = await fetch(IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || "Erro ao gerar imagem");
  }

  return resp.json();
}

const FAQ_CATEGORIES = [
  {
    label: "🏠 Consórcio",
    questions: [
      "O que é consórcio?",
      "Como funciona a contemplação?",
      "Vantagens vs financiamento",
      "Quais modalidades existem?",
    ],
  },
  {
    label: "💰 Vendas",
    questions: [
      "Como registrar uma venda?",
      "Como funciona o CRM?",
      "Dicas para fechar mais vendas",
      "Como apresentar produtos ao cliente?",
    ],
  },
  {
    label: "📈 Carreira",
    questions: [
      "Como funciona o plano de carreira?",
      "Quais são os níveis de progressão?",
      "Como subir de nível?",
      "O que é a Jornada Impacto?",
    ],
  },
  {
    label: "📱 App",
    questions: [
      "Quais ferramentas estão disponíveis?",
      "Como usar a Trilha do Iniciante?",
      "Como acompanhar liberação de crédito?",
      "Como gerenciar minha equipe?",
    ],
  },
];

const IMAGE_SUGGESTIONS = [
  "Post para Instagram de carta de crédito de imóvel R$300mil",
  "Story promocional de consórcio de automóvel",
  "Banner para carta contemplada com lance embutido",
  "Post de oportunidade de investimento via consórcio",
];

type ChatMode = "chat" | "image" | "simulados";

const ChatBot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stop TTS when leaving page
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop?.();
    };
  }, []);

  const speak = (text: string) => {
    if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[#*_`>]/g, "").replace(/\[(.*?)\]\(.*?\)/g, "$1").slice(0, 600);
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = "pt-BR";
      u.rate = 1.02;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const pt = voices.find((v) => v.lang?.startsWith("pt"));
      if (pt) u.voice = pt;
      window.speechSynthesis.speak(u);
    } catch {}
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
        if (text) {
          setInput(text);
          setTimeout(() => sendText(text), 50);
        }
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

  const startScenario = (s: Scenario) => {
    window.speechSynthesis?.cancel();
    setScenario(s);
    setMode("chat");
    const opener: Msg = { role: "assistant", content: `🎬 **${s.title}** — Cliente IA iniciando...\n\n_${s.opener}_` };
    setMessages([opener]);
    setTimeout(() => speak(s.opener), 200);
  };

  const exitScenario = () => {
    window.speechSynthesis?.cancel();
    setScenario(null);
    setMessages([]);
  };

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.imageUrl) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };
    await streamChat({
      messages: [...messages, userMsg],
      onDelta: upsert,
      onDone: () => {
        setLoading(false);
        if (scenario && assistantSoFar) speak(assistantSoFar);
      },
      scenario: scenario?.key,
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
        setLoading(false);
      },
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // In scenario mode, always use chat (no image generation)
    if (scenario) {
      setInput(text);
      return sendText(text);
    }

    // Auto-detect image requests even in chat mode
    const imageKeywords = /\b(gere|gerar|crie|criar|faça|fazer|imagem|criativo|post|banner|story|arte)\b/i;
    if (mode === "image" || (imageKeywords.test(text) && /\b(imagem|criativo|post|banner|story|arte)\b/i.test(text))) {
      return sendImage(text);
    }

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.imageUrl) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: upsert,
      onDone: () => setLoading(false),
      onError: (msg) => {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
        setLoading(false);
      },
    });
  };

  const sendImage = async (text: string) => {
    const userMsg: Msg = { role: "user", content: `🎨 ${text}` };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { imageUrl, text: description } = await generateCreativeImage(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: description || "Aqui está seu criativo! 🎨", imageUrl },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar imagem";
      toast.error(msg);
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-10 pb-3 border-b border-border bg-card/80 backdrop-blur-lg">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">
              {scenario ? `🎬 ${scenario.title}` : "Vendedor IA"}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {scenario ? "Simulado em andamento — fale ou digite" :
                mode === "chat" ? "Tire dúvidas sobre Ademicon e o app" :
                mode === "image" ? "Gere criativos de vendas" : "Treine vendas em cenários reais"}
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
            onClick={exitScenario}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground"
            title="Encerrar simulado"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Mode toggle */}
        {!scenario && (
        <div className="flex gap-1 bg-secondary rounded-full p-0.5">
          <button
            onClick={() => setMode("chat")}
            className={`p-1.5 rounded-full transition-colors ${
              mode === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode("image")}
            className={`p-1.5 rounded-full transition-colors ${
              mode === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Gerar Imagem"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode("simulados")}
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

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && mode === "simulados" && !scenario && (
          <SimuladosPanel onStart={startScenario} />
        )}

        {messages.length === 0 && mode === "chat" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-glow">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Olá! 👋</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Sou o assistente virtual da Ademicon. Pergunte sobre consórcios, produtos ou funcionalidades do app!
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
                  onClick={() => { setInput(q); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && mode === "image" && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-20">
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-glow">
              <ImageIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Criativos de Vendas 🎨</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Descreva o criativo que deseja e a IA vai gerar uma imagem profissional para suas vendas de carta de crédito!
            </p>
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
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <Avatar className="w-7 h-7 mt-1 shrink-0">
                <AvatarFallback className="gradient-gold text-primary-foreground text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {msg.imageUrl && (
                <div className="mb-2">
                  <img
                    src={msg.imageUrl}
                    alt="Criativo gerado"
                    className="rounded-xl max-w-full w-full"
                    loading="lazy"
                  />
                  <a
                    href={msg.imageUrl}
                    download="criativo-ademicon.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    📥 Baixar imagem
                  </a>
                </div>
              )}
              {msg.role === "assistant" && !msg.imageUrl ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                !msg.imageUrl && msg.content
              )}
              {msg.imageUrl && msg.content && (
                <p className="mt-1 text-xs text-muted-foreground">{msg.content}</p>
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
                <span className="text-xs text-muted-foreground">
                  {mode === "image" ? "Gerando criativo..." : "Pensando..."}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/80 backdrop-blur-lg">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "image" ? "Descreva o criativo que deseja..." : "Digite sua pergunta..."}
            className="flex-1 bg-secondary border-border rounded-full text-sm"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0"
            disabled={loading || !input.trim()}
          >
            {mode === "image" ? <ImageIcon className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
