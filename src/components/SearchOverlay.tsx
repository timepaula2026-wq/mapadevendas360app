import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Video, Link2, Loader2, LayoutGrid, Mic, MicOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ContentViewerModal from "@/components/ContentViewerModal";
import { toast } from "sonner";
import { requireAi } from "@/lib/aiAccess";

// Tipagem mínima da Web Speech API (não incluída nos tipos padrão do TS/DOM)
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const GRID_SECTIONS = [
  { id: "trilha", label: "Trilha do Iniciante", route: "/trilha" },
  { id: "vendas", label: "Central de Vendas & CRM", route: "/vendas" },
  { id: "ferramentas", label: "Acessos de Ferramentas", route: "/ferramentas" },
  { id: "treinamentos", label: "Treinamentos", route: "/trainings" },
  { id: "carreira", label: "Plano de Carreira", route: "/carreira" },
  { id: "apresentacao", label: "Apresentação de Produtos", route: "/apresentacao" },
  { id: "sorteios", label: "Sorteios & Comunicados", route: "/sorteios" },
  { id: "credito", label: "Liberação de Crédito", route: "/credito" },
  { id: "jornada", label: "Jornada Impacto", route: "/jornada" },
  { id: "equipe", label: "Gestão de Equipe", route: "/equipe" },
  { id: "cliente", label: "Área do Cliente", route: "/cliente" },
  { id: "administrativo", label: "Administrativo", route: "/administrativo" },
  { id: "analise", label: "Plataforma de Análise", route: "/analise" },
  { id: "loja", label: "Loja", route: "/loja" },
  { id: "locacao", label: "Locação de Materiais", route: "/locacao" },
  { id: "presenca", label: "Presença Treinamentos", route: "/presenca-treinamentos" },
  { id: "comissao", label: "Calculadora de Comissão", route: "/vendas?calc=1" },
];

interface SearchResult {
  id: string;
  title: string;
  type: string;
  section: string;
  url?: string | null;
  youtube_id?: string | null;
  route?: string | null;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const INTERNAL_VIEWER_TYPES = ["youtube", "pdf", "image", "video", "text"];

const inferViewerType = (result: SearchResult) => {
  if (result.youtube_id) return "youtube";
  const cleanUrl = (result.url || "").split(/[?#]/)[0].toLowerCase();
  if (result.type === "document" || result.type === "pdf" || cleanUrl.endsWith(".pdf")) return "pdf";
  return result.type;
};

const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewer, setViewer] = useState<{
    title: string;
    type: string;
    url: string | null;
    youtubeId: string | null;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported =
    typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    } else {
      recognitionRef.current?.stop();
      setListening(false);
    }
  }, [open]);

  const handleAskAI = async (q: string) => {
    if (!q.trim()) return;
    if (!requireAi()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-navigate", {
        body: { query: q },
      });
      if (error) throw error;

      if (data?.kind === "section" || data?.kind === "training") {
        navigate(data.route);
        onClose();
        return;
      }

      if (data?.kind === "content") {
        const viewerType = inferViewerType({
          id: data.id,
          title: data.label,
          type: data.type,
          section: "",
          url: data.url,
          youtube_id: data.youtube_id,
        });
        const viewerUrl = data.url || (data.youtube_id ? `https://www.youtube.com/watch?v=${data.youtube_id}` : null);
        setViewer({ title: data.label, type: viewerType, url: viewerUrl, youtubeId: data.youtube_id || null });
        onClose();
        return;
      }

      toast.info("Não encontrei nada sobre isso. Tente descrever de outro jeito.");
    } catch (err) {
      console.error(err);
      toast.error("Não consegui buscar agora. Tente de novo.");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleMic = () => {
    if (!speechSupported) {
      toast.error("Seu navegador não tem suporte a busca por voz.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      setQuery(transcript);
      if (transcript.trim()) handleAskAI(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;

      const [sectionRes, contentRes] = await Promise.all([
        supabase
          .from("section_contents")
          .select("id, title, type, section_id, url, youtube_id")
          .ilike("title", searchTerm)
          .limit(10),
        supabase
          .from("content_items")
          .select("id, title, type, training_id, url, youtube_id")
          .ilike("title", searchTerm)
          .limit(10),
      ]);

      const mapped: SearchResult[] = [];

      // Search grid sections locally
      const lowerQuery = query.toLowerCase();
      GRID_SECTIONS.filter((s) => s.label.toLowerCase().includes(lowerQuery)).forEach((s) => {
        mapped.push({
          id: `section-${s.id}`,
          title: s.label,
          type: "section",
          section: "Aba",
          route: s.route,
        });
      });

      // DB results
      (sectionRes.data || []).forEach((r) => {
        mapped.push({
          id: r.id,
          title: r.title,
          type: r.type,
          section: "Seção",
          url: r.url,
          youtube_id: r.youtube_id,
        });
      });
      (contentRes.data || []).forEach((r) => {
        mapped.push({
          id: r.id,
          title: r.title,
          type: r.type,
          section: "Treinamento",
          url: r.url,
          youtube_id: r.youtube_id,
        });
      });

      setResults(mapped);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const getIcon = (type: string) => {
    if (type === "section") return <LayoutGrid className="w-4 h-4 text-primary" />;
    if (type === "video") return <Video className="w-4 h-4 text-primary" />;
    if (type === "pdf" || type === "document") return <FileText className="w-4 h-4 text-primary" />;
    return <Link2 className="w-4 h-4 text-primary" />;
  };

  const handleOpen = (result: SearchResult) => {
    if (result.route) {
      navigate(result.route);
      onClose();
      return;
    }

    const viewerType = inferViewerType(result);
    const viewerUrl = result.url || (result.youtube_id ? `https://www.youtube.com/watch?v=${result.youtube_id}` : null);

    if (INTERNAL_VIEWER_TYPES.includes(viewerType)) {
      setViewer({
        title: result.title,
        type: viewerType,
        url: viewerUrl,
        youtubeId: result.youtube_id || null,
      });
      onClose();
      return;
    }

    if (result.url) {
      window.open(result.url, "_blank");
    }
    onClose();
  };

  if (!open && !viewer) return null;

  return (
    <>
    {open && (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col max-w-md mx-auto px-4 pt-12">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAskAI(query);
            }}
            placeholder="Diga ou digite o que você precisa..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {speechSupported && (
            <button
              onClick={toggleMic}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                listening ? "bg-primary text-primary-foreground animate-pulse" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Falar"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {query.trim().length >= 2 && (
          <button
            onClick={() => handleAskAI(query)}
            disabled={aiLoading}
            className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg py-2 transition-colors disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Levar direto para "{query}"
          </button>
        )}

        {/* Results */}
        <div className="mt-4 space-y-1 overflow-y-auto max-h-[70vh]">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum resultado encontrado
            </p>
          )}

          {!loading && results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleOpen(r)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-card transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {getIcon(r.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="text-[10px] text-muted-foreground">{r.section} · {r.type}</p>
              </div>
            </button>
          ))}

          {!loading && query.length < 2 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}
        </div>
      </div>
    </div>
    )}
    {viewer && (
      <ContentViewerModal
        open={!!viewer}
        onClose={() => setViewer(null)}
        title={viewer.title}
        type={viewer.type}
        url={viewer.url}
        youtubeId={viewer.youtubeId}
      />
    )}
    </>
  );
};

export default SearchOverlay;
