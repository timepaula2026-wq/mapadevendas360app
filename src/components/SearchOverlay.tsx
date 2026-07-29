import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Video, Link2, Loader2, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ContentViewerModal from "@/components/ContentViewerModal";

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

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [open]);

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
            placeholder="Buscar arquivos, vídeos, links..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

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
