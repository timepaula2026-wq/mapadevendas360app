import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
// @ts-ignore - vite ?url import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";

(pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

interface Props {
  url: string;
  /** 1 = ajustar à largura. */
  zoom?: number;
  onLoaded?: () => void;
  onError?: () => void;
  /** Progresso de leitura 0-100 conforme o usuário rola. */
  onProgress?: (pct: number) => void;
  /** Disparado quando o usuário chega ao fim (>=95%) ou o PDF cabe na tela. */
  onReachEnd?: () => void;
}

/**
 * Visualizador de PDF renderizado com pdf.js em <canvas>.
 * Vantagens sobre <iframe>/gview:
 *  - rolagem nativa confiável no iOS (é DOM normal, não iframe);
 *  - resolução nítida (renderiza no devicePixelRatio do aparelho);
 *  - carregamento observável (nunca fica preso em "Carregando PDF…").
 */
const PdfCanvasViewer = ({ url, zoom = 1, onLoaded, onError, onProgress, onReachEnd }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [doc, setDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task: any;
    setLoading(true);
    setFailed(false);
    setDoc(null);
    setNumPages(0);
    (async () => {
      try {
        task = pdfjs.getDocument({ url, withCredentials: false });
        const loaded = await task.promise;
        if (cancelled) return;
        setDoc(loaded);
        setNumPages(loaded.numPages);
        setLoading(false);
        onLoaded?.();
      } catch (err) {
        if (cancelled) return;
        console.error("Falha ao renderizar PDF com pdf.js:", err);
        setLoading(false);
        setFailed(true);
        onError?.();
      }
    })();
    return () => {
      cancelled = true;
      try { task?.destroy?.(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) {
      onProgress?.(100);
      onReachEnd?.();
      return;
    }
    const ratio = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    onProgress?.(ratio * 100);
    if (ratio >= 0.95) onReachEnd?.();
  };

  // Se o documento inteiro couber sem rolagem, considera lido.
  useEffect(() => {
    if (loading || failed || !numPages) return;
    const t = window.setTimeout(() => {
      const el = containerRef.current;
      if (el && el.scrollHeight <= el.clientHeight + 4) {
        onProgress?.(100);
        onReachEnd?.();
      }
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, failed, numPages]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="absolute inset-0 overflow-y-auto overflow-x-auto bg-neutral-900"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
    >
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Carregando PDF…</p>
        </div>
      )}
      <div className="flex flex-col items-center gap-3 py-3">
        {doc &&
          Array.from({ length: numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} pageNumber={i + 1} zoom={zoom} container={containerRef} />
          ))}
      </div>
    </div>
  );
};

const PdfPage = ({
  doc,
  pageNumber,
  zoom,
  container,
}: {
  doc: any;
  pageNumber: number;
  zoom: number;
  container: React.MutableRefObject<HTMLDivElement | null>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(pageNumber <= 2);
  const holderRef = useRef<HTMLDivElement | null>(null);

  // Lazy render: só renderiza páginas próximas da viewport (carregamento rápido).
  useEffect(() => {
    const el = holderRef.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { root: container.current, rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, container]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let renderTask: any;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const holder = holderRef.current;
        if (!canvas || !holder) return;
        const available = (container.current?.clientWidth || holder.clientWidth || 320) - 16;
        const base = page.getViewport({ scale: 1 });
        const scale = (available / base.width) * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
      try { renderTask?.cancel?.(); } catch { /* noop */ }
    };
  }, [doc, pageNumber, zoom, visible, container]);

  return (
    <div ref={holderRef} className="w-full flex justify-center min-h-[200px]">
      <canvas ref={canvasRef} className="bg-white shadow-md max-w-none" />
    </div>
  );
};

export default PdfCanvasViewer;