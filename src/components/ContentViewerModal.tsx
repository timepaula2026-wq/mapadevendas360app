import { Printer, Download, ZoomIn, ZoomOut, Maximize2, Loader2, RotateCw, ExternalLink, CheckCircle2, FastForward } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageZoomModal from "@/components/ImageZoomModal";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";

interface ContentViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  type: string;
  url: string | null;
  youtubeId: string | null;
  /** Quando true, exibe o botão de baixar (apenas para PDF). */
  allowDownload?: boolean;
  /** Texto descritivo exibido abaixo do conteúdo dentro do visualizador. */
  description?: string | null;
  /** Disparado uma vez ao abrir um conteúdo válido (usado para marcar progresso). */
  onOpened?: () => void;
  /**
   * Disparado quando o conteúdo é EFETIVAMENTE consumido:
   *  - vídeo (MP4/YouTube/Vimeo): ao terminar o vídeo (≥95%);
   *  - PDF: quando o usuário rola até o final (≥95% da altura);
   *  - imagem/link/outros: imediatamente ao abrir.
   * Quando informado, é a fonte oficial de "concluído" para a Trilha.
   */
  onCompleted?: () => void;
}

// Detects video provider and returns an embeddable URL when possible.
// Returns null when the provider is known not to allow iframe embedding.
const getVideoEmbed = (
  rawUrl: string,
  youtubeId: string | null
): { embedUrl: string | null; isVideo: boolean; provider: string } => {
  const url = rawUrl?.trim() || "";

  // YouTube (also covers stored youtube_id)
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  const ytId = youtubeId || (ytMatch ? ytMatch[1] : null);
  if (ytId) {
    return {
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1&enablejsapi=1`,
      isVideo: true,
      provider: "youtube",
    };
  }

  // Vimeo: vimeo.com/{id} or player.vimeo.com/video/{id}
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&api=1`,
      isVideo: true,
      provider: "vimeo",
    };
  }

  // Google Drive video: /file/d/{id}/...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return {
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      isVideo: true,
      provider: "drive",
    };
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return {
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      isVideo: true,
      provider: "loom",
    };
  }

  // NotebookLM does not allow iframe embedding
  if (/notebooklm\.google\.com/.test(url)) {
    return { embedUrl: null, isVideo: false, provider: "notebooklm" };
  }

  return { embedUrl: null, isVideo: false, provider: "unknown" };
};

const ContentViewerModal = ({ open, onClose, title, type, url, youtubeId, allowDownload = false, onOpened, onCompleted }: ContentViewerModalProps) => {
  const { isAdmin } = useIsAdmin();
  // "youtube" = link/embed (YouTube, Vimeo, Drive...).
  // "video"   = arquivo MP4/WebM hospedado direto (player nativo).
  const isLinkVideo = type === "youtube";
  const isFileVideo = type === "video";
  const isVideoType = isLinkVideo || isFileVideo;
  const videoInfo = isLinkVideo && url ? getVideoEmbed(url, youtubeId) : null;

  // Zoom da imagem dentro do conteúdo
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Loading state para PDF (iOS demora a renderizar o primeiro frame)
  const [pdfLoaded, setPdfLoaded] = useState(false);
  // Fallback para Google Docs Viewer quando o renderer nativo demora demais no mobile
  const [useFallback, setUseFallback] = useState(false);
  // Zoom do PDF (1 = Fit / 100%). Controlado via wrapper com CSS transform,
  // pois o conteúdo do iframe é cross-origin e não pode ser manipulado por JS.
  const [pdfZoom, setPdfZoom] = useState(1);
  // Rotação de mídia (vídeo/imagem): 0 / 90 / 180 / 270
  const [mediaRotation, setMediaRotation] = useState(0);
  const rotateMedia = () => setMediaRotation((r) => (r + 90) % 360);
  const isMediaType = isVideoType || type === "image";

  // Estado de "consumiu o conteúdo" (rolou o PDF até o fim ou viu o vídeo todo)
  const [completedFlag, setCompletedFlag] = useState(false);
  const completedRef = useRef(false);
  // Progresso 0-100 para vídeo/PDF, exibido no header.
  const [progress, setProgress] = useState(0);
  const updateProgress = (pct: number) => {
    if (!Number.isFinite(pct)) return;
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    setProgress((prev) => (clamped > prev ? clamped : prev));
  };
  const fireCompleted = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompletedFlag(true);
    setProgress(100);
    onCompleted?.();
  };
  const requiresWatch = type === "youtube" || type === "video" || type === "pdf";

  // Reset de progresso a cada abertura
  useEffect(() => {
    if (open) {
      completedRef.current = false;
      setCompletedFlag(false);
      setProgress(0);
    }
  }, [open, url, type]);

  const PDF_MIN_ZOOM = 1;
  const PDF_MAX_ZOOM = 3;
  const PDF_ZOOM_STEP = 0.25;
  const zoomIn = () =>
    setPdfZoom((z) => Math.min(PDF_MAX_ZOOM, +(z + PDF_ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setPdfZoom((z) => Math.max(PDF_MIN_ZOOM, +(z - PDF_ZOOM_STEP).toFixed(2)));
  const zoomFit = () => setPdfZoom(1);

  // iOS Safari não rola dentro de <object>; usamos Google Docs Viewer como alternativa
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPad|iPhone|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => {
    if (!(open && type === "pdf")) return;
    setPdfLoaded(false);
    // Sempre inicia em Fit (100%) — sem zoom inicial nem corte central.
    setPdfZoom(1);
    // No iOS o renderer nativo de PDF abre travado em zoom e não rola direito.
    // Usamos o Google Docs Viewer por padrão no iOS para garantir leitura
    // confortável (página inteira + rolagem). Em desktop/Android usamos o
    // visualizador nativo (mais rápido).
    // Quando o modo Trilha está ativo (onCompleted definido), forçamos o
    // visualizador alternativo (gview) também no desktop/Android — assim a
    // rolagem acontece em um wrapper DOM real e conseguimos detectar o
    // "leu até o fim" (impossível dentro do iframe nativo de PDF).
    setUseFallback(isIOS || !!onCompleted);
    if (!isMobile) return;
    const t = window.setTimeout(() => {
      setPdfLoaded((loaded) => {
        if (!loaded) {
          setUseFallback(true);
          setPdfLoaded(false);
        }
        return loaded;
      });
    }, 4000);
    return () => window.clearTimeout(t);
  }, [open, url, type, isMobile, isIOS, onCompleted]);

  // Sempre que abrir um conteúdo novo, zera a rotação da mídia.
  useEffect(() => {
    if (open) setMediaRotation(0);
  }, [open, url, type]);

  // Marca o conteúdo como concluído ao abrir (uma vez por abertura)
  useEffect(() => {
    if (open && (url || youtubeId) && onOpened) {
      onOpened();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url, youtubeId]);

  // Para tipos que NÃO exigem assistir (imagem/link/outros), conclui ao abrir.
  useEffect(() => {
    if (!open) return;
    if (!(url || youtubeId)) return;
    if (!requiresWatch) fireCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, url, youtubeId, type]);

  // ===== Detecção de "vídeo terminado" para YouTube e Vimeo via postMessage =====
  useEffect(() => {
    if (!open) return;
    if (type !== "youtube") return;
    const handler = (e: MessageEvent) => {
      try {
        const origin = e.origin || "";
        // YouTube
        if (origin.includes("youtube.com")) {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          const info = data?.info;
          // ENDED
          const state = info?.playerState ?? data?.info;
          if (state === 0) fireCompleted();
          // Progresso: currentTime / duration
          const ct = typeof info?.currentTime === "number" ? info.currentTime : null;
          const dur = typeof info?.duration === "number" ? info.duration : null;
          if (ct != null && dur && dur > 0) {
            updateProgress((ct / dur) * 100);
          }
          return;
        }
        // Vimeo
        if (origin.includes("vimeo.com")) {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data?.event === "ended") fireCompleted();
          if (data?.event === "playProgress" || data?.event === "timeupdate") {
            const pct = typeof data?.data?.percent === "number" ? data.data.percent * 100 : null;
            if (pct != null) updateProgress(pct);
          }
          return;
        }
      } catch {
        /* noop */
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type]);

  // Refs e handlers para detectar fim de scroll do PDF
  const pdfScrollRef = useRef<HTMLDivElement | null>(null);
  const handlePdfScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight <= el.clientHeight + 4) {
      updateProgress(100);
      fireCompleted();
      return;
    }
    const ratio = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    updateProgress(ratio * 100);
    if (ratio >= 0.95) fireCompleted();
  };
  // Quando o PDF carrega e cabe inteiro sem scroll, considera concluído.
  useEffect(() => {
    if (!open || type !== "pdf" || !pdfLoaded) return;
    const el = pdfScrollRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      if (el.scrollHeight <= el.clientHeight + 4) fireCompleted();
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, pdfLoaded]);

  // Ref do iframe de vídeo (YT/Vimeo) para enviar handshake postMessage.
  const videoIframeRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    if (!open || type !== "youtube") return;
    const iframe = videoIframeRef.current;
    if (!iframe) return;
    const sendHandshake = () => {
      try {
        // YouTube IFrame API: registra listener de eventos
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
          "*"
        );
        // YouTube: assina onStateChange (necessário para receber infoDelivery
        // com currentTime/duration usados no cálculo de progresso).
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"], id: 1, channel: "widget" }),
          "*"
        );
        // Vimeo Player API: assina o evento "ended"
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "addEventListener", value: "ended" }),
          "*"
        );
        // Vimeo: assina progresso
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "addEventListener", value: "playProgress" }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "addEventListener", value: "timeupdate" }),
          "*"
        );
      } catch {
        /* noop */
      }
    };
    iframe.addEventListener("load", sendHandshake);
    // Tenta também imediatamente caso o iframe já esteja carregado
    sendHandshake();
    return () => iframe.removeEventListener("load", sendHandshake);
  }, [open, type, url, youtubeId]);

  const handlePrint = () => {
    if (isVideoType || !url) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* noop */
      }
    };
    document.body.appendChild(iframe);
  };

  const handleDownload = async () => {
    if (!url) return;
    const safeName = (title || "arquivo").replace(/\.pdf$/i, "") + ".pdf";

    // Fallback: abre a URL direta em nova aba (último recurso quando o fetch
    // falha por CORS ou o navegador bloqueia o download programático).
    const openDirect = () => {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        // Pop-up bloqueado: navega na própria janela
        window.location.href = url;
      }
    };

    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const original = await res.arrayBuffer();

      // Aplica marca d'água "Mapa de Vendas" embutida em todas as páginas do PDF.
      // A marca é desenhada como conteúdo real do PDF (não é metadado) — para removê-la
      // seria necessário editar manualmente cada página em um editor de PDF.
      const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(original, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text = "MAPA DE VENDAS";
      const fontSize = 38;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        // Grade diagonal de marcas para cobrir a página inteira sem atrapalhar leitura
        const stepX = Math.max(textWidth * 0.9, 280);
        const stepY = 180;
        for (let y = -stepY; y < height + stepY; y += stepY) {
          for (let x = -stepX; x < width + stepX; x += stepX) {
            page.drawText(text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(0.55, 0.05, 0.15),
              opacity: 0.12,
              rotate: degrees(-30),
            });
          }
        }
      });

      const stamped = await pdfDoc.save({ useObjectStreams: false });
      const blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      // iOS Safari ignora o atributo `download` em blobs — precisa abrir em
      // nova aba para que o usuário use o "Compartilhar > Salvar em arquivos".
      if (isIOS) {
        const win = window.open(blobUrl, "_blank", "noopener,noreferrer");
        if (!win) window.location.href = blobUrl;
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        return;
      }

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = safeName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Falha ao baixar PDF com marca d'água:", err);
      toast.message("Abrindo PDF em nova aba para download…");
      openDirect();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1 mr-4">{title}</h3>
          <div className="flex items-center gap-1 mr-8">
            {requiresWatch && (url || youtubeId) && (
              completedFlag ? (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-500 px-2 py-1 rounded-full bg-emerald-500/10 mr-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                </span>
              ) : (
                <span
                  className="hidden sm:inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground pl-2 pr-1 py-1 rounded-full bg-secondary mr-1"
                  title={type === "pdf" ? "Role até o fim para concluir" : "Assista até o fim para concluir"}
                >
                  <span className="hidden md:inline">
                    {type === "pdf" ? "Leitura" : "Reprodução"}
                  </span>
                  <span
                    className="relative h-1.5 w-16 rounded-full bg-background/60 overflow-hidden"
                    aria-label="Progresso"
                  >
                    <span
                      className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span className="tabular-nums text-foreground/80 px-1 min-w-[2.5rem] text-center">
                    {progress}%
                  </span>
                </span>
              )
            )}
            {isAdmin && requiresWatch && !completedFlag && (url || youtubeId) && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] gap-1 mr-1 border-primary/40 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  fireCompleted();
                  toast.success("Conteúdo marcado como concluído (modo admin)");
                }}
                title="Atalho de admin: marca como visto sem precisar assistir/rolar tudo"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Concluir (admin)</span>
              </Button>
            )}
            {type === "pdf" && url && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={zoomOut}
                  disabled={pdfZoom <= PDF_MIN_ZOOM}
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={zoomFit}
                  title="Ajustar à página (Fit)"
                  aria-label="Ajustar à página"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={zoomIn}
                  disabled={pdfZoom >= PDF_MAX_ZOOM}
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-center select-none">
                  {Math.round(pdfZoom * 100)}%
                </span>
              </>
            )}
            {isMediaType && url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={rotateMedia}
                title="Girar (horizontal/vertical)"
                aria-label="Girar mídia 90 graus"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            {(type === "pdf" || type === "image") && url && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint} title="Imprimir">
                <Printer className="w-4 h-4" />
              </Button>
            )}
            {type === "pdf" && url && allowDownload && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} title="Baixar">
                <Download className="w-4 h-4" />
              </Button>
            )}
            {url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const win = window.open(url, "_blank", "noopener,noreferrer");
                  if (!win) window.location.href = url;
                }}
                title="Abrir em nova aba"
                aria-label="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 min-h-0 bg-muted select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {!url && !youtubeId ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
              <p className="text-sm text-muted-foreground max-w-md">
                Este conteúdo está sem arquivo ou link. Edite no painel administrativo e adicione o arquivo ou URL.
              </p>
            </div>
          ) : isFileVideo && url ? (
            <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
              <video
                src={url}
                controls
                autoPlay
                playsInline
                controlsList="nodownload noremoteplayback noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onEnded={() => fireCompleted()}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration > 0) {
                    const pct = (v.currentTime / v.duration) * 100;
                    updateProgress(pct);
                    if (pct >= 95) fireCompleted();
                  }
                }}
                className="object-contain"
                style={{
                  width: mediaRotation % 180 === 0 ? "100%" : "100vh",
                  height: mediaRotation % 180 === 0 ? "100%" : "100vw",
                  maxWidth: mediaRotation % 180 === 0 ? "100%" : "100vh",
                  maxHeight: mediaRotation % 180 === 0 ? "100%" : "100vw",
                  transform: `rotate(${mediaRotation}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
              >
                Seu navegador não suporta a reprodução deste vídeo.
              </video>
            </div>
          ) : isLinkVideo && videoInfo?.embedUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
              <iframe
                ref={videoIframeRef}
                src={videoInfo.embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                title={title}
                style={{
                  width: mediaRotation % 180 === 0 ? "100%" : "100vh",
                  height: mediaRotation % 180 === 0 ? "100%" : "100vw",
                  border: 0,
                  transform: `rotate(${mediaRotation}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
              />
            </div>
          ) : isLinkVideo && url ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground max-w-md">
                Este vídeo não permite visualização incorporada.
              </p>
              <Button
                onClick={() => {
                  const win = window.open(url, "_blank", "noopener,noreferrer");
                  if (!win) window.location.href = url;
                }}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Abrir em nova aba
              </Button>
            </div>
          ) : type === "pdf" && url ? (
            <div
              className="relative w-full h-full bg-muted"
              style={{
                touchAction: pdfZoom > 1 ? "pan-x pan-y" : "pan-y",
                overflow: pdfZoom > 1 ? "auto" : "hidden",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
              ref={pdfZoom > 1 ? pdfScrollRef : undefined}
              onScroll={pdfZoom > 1 ? handlePdfScroll : undefined}
            >
              {!pdfLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted z-10 px-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Carregando PDF…</p>
                  {isMobile && !useFallback && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setUseFallback(true); setPdfLoaded(false); }}
                    >
                      Tentar visualizador alternativo
                    </Button>
                  )}
                </div>
              )}
              <div
                className="relative"
                style={{
                  width: `${100 * pdfZoom}%`,
                  height: `${100 * pdfZoom}%`,
                  transition: "width 0.18s ease-out, height 0.18s ease-out",
                }}
              >
              {useFallback ? (
                // No iOS o iframe do gview NÃO recebe gestos de scroll por toque
                // (Safari trava o ponteiro dentro do iframe). Solução: envolver o
                // iframe num wrapper rolável e aumentar a altura intrínseca do
                // iframe para que TODA a navegação aconteça no scroll do wrapper
                // pai — que respeita inertial scroll do iOS.
                isIOS ? (
                  <div
                    ref={pdfScrollRef}
                    onScroll={handlePdfScroll}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-muted"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-y",
                      overscrollBehavior: "contain",
                    }}
                  >
                    <iframe
                      key="gview-ios"
                      src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
                      title={title}
                      loading="eager"
                      onLoad={() => setPdfLoaded(true)}
                      className="block w-full border-0 pointer-events-none"
                      style={{
                        height: "400vh",
                        minHeight: "400vh",
                        touchAction: "pan-y",
                      }}
                      scrolling="no"
                    />
                  </div>
                ) : (
                  // Desktop/Android com gview: mesmo padrão do iOS — wrapper
                  // rolável + iframe com altura intrínseca grande, para que
                  // possamos detectar quando o usuário rolou todo o PDF
                  // (necessário para liberar a próxima aba na Trilha).
                  <div
                    ref={pdfScrollRef}
                    onScroll={handlePdfScroll}
                    className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-muted"
                    style={{ overscrollBehavior: "contain" }}
                  >
                    <iframe
                      key="gview"
                      src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
                      title={title}
                      loading="eager"
                      onLoad={() => setPdfLoaded(true)}
                      className="block w-full border-0 pointer-events-none"
                      style={{ height: "400vh", minHeight: "400vh" }}
                      scrolling="no"
                    />
                  </div>
                )
              ) : isIOS ? (
                // iOS Safari NÃO rola dentro do iframe de PDF: o conteúdo fica
                // travado na primeira página. Solução: container pai rolável
                // (overflow-auto + inertial scroll) e iframe com altura intrínseca
                // grande para que o scroll aconteça no container, não no iframe.
                <div
                  ref={pdfScrollRef}
                  onScroll={handlePdfScroll}
                  className="absolute inset-0 overflow-auto bg-muted"
                  style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                >
                  <iframe
                    key="native-ios"
                    src={url}
                    title={title}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onLoad={() => setPdfLoaded(true)}
                    className="block w-full border-0"
                    style={{ height: "300vh", minHeight: "300vh", touchAction: "pan-y" }}
                    scrolling="no"
                  />
                </div>
              ) : (
                <iframe
                  key="native"
                  src={`${url}#toolbar=0&navpanes=0&statusbar=0&messages=0&scrollbar=1&view=Fit&zoom=page-fit&pagemode=none`}
                  className="w-full h-full border-0"
                  title={title}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  onLoad={() => setPdfLoaded(true)}
                  style={{ touchAction: "pan-y" }}
                />
              )}
              </div>
            </div>
          ) : type === "image" && url ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black/40 p-4">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in"
                draggable={false}
                onClick={() => setZoomImage(url)}
                style={{
                  transform: `rotate(${mediaRotation}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
              />
              <button
                type="button"
                onClick={() => setZoomImage(url)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 ring-1 ring-white/30 text-white flex items-center justify-center hover:bg-black/85 active:scale-95 transition shadow-lg"
                aria-label="Ampliar imagem"
                title="Ampliar"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          ) : url ? (
            (() => {
              // Domains that block iframe embedding via X-Frame-Options / CSP
              const noEmbedDomains = [
                "notebooklm.google.com",
                "docs.google.com",
                "drive.google.com",
                "instagram.com",
                "facebook.com",
                "linkedin.com",
                "x.com",
                "twitter.com",
              ];
              let blocked = false;
              try {
                const host = new URL(url).hostname.toLowerCase();
                blocked = noEmbedDomains.some((d) => host === d || host.endsWith("." + d));
              } catch {}
              if (blocked) {
                return (
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                    <p className="text-sm text-muted-foreground max-w-md">
                      Este conteúdo não permite visualização incorporada.
                    </p>
                    <Button
                      onClick={() => {
                        const win = window.open(url, "_blank", "noopener,noreferrer");
                        if (!win) window.location.href = url;
                      }}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Abrir em nova aba
                    </Button>
                  </div>
                );
              }
              return (
                <iframe
                  src={url}
                  className="w-full h-full"
                  title={title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Conteúdo não disponível
            </div>
          )}
        </div>
      </DialogContent>
      {zoomImage && (
        <ImageZoomModal
          src={zoomImage}
          title={title}
          onClose={() => setZoomImage(null)}
        />
      )}
    </Dialog>
  );
};

export default ContentViewerModal;
