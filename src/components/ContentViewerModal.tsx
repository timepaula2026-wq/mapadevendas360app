import { Printer, Download, ZoomIn, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageZoomModal from "@/components/ImageZoomModal";

interface ContentViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  type: string;
  url: string | null;
  youtubeId: string | null;
  /** Quando true, exibe o botão de baixar (apenas para PDF). */
  allowDownload?: boolean;
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
      embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1`,
      isVideo: true,
      provider: "youtube",
    };
  }

  // Vimeo: vimeo.com/{id} or player.vimeo.com/video/{id}
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
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

const ContentViewerModal = ({ open, onClose, title, type, url, youtubeId, allowDownload = false }: ContentViewerModalProps) => {
  // "youtube" = link/embed (YouTube, Vimeo, Drive...).
  // "video"   = arquivo MP4/WebM hospedado direto (player nativo).
  const isLinkVideo = type === "youtube";
  const isFileVideo = type === "video";
  const isVideoType = isLinkVideo || isFileVideo;
  const videoInfo = isLinkVideo && url ? getVideoEmbed(url, youtubeId) : null;

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
    try {
      const res = await fetch(url);
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

      // Bloqueia edição/cópia/extração via flags do PDF (proteção declarativa).
      const stamped = await pdfDoc.save({ useObjectStreams: false });
      const blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = (title || "arquivo").replace(/\.pdf$/i, "");
      a.download = `${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      /* noop */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1 mr-4">{title}</h3>
          <div className="flex items-center gap-1 mr-8">
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
            <div className="w-full h-full flex items-center justify-center bg-black">
              <video
                src={url}
                controls
                autoPlay
                playsInline
                controlsList="nodownload noremoteplayback noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain"
              >
                Seu navegador não suporta a reprodução deste vídeo.
              </video>
            </div>
          ) : isLinkVideo && videoInfo?.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              title={title}
            />
          ) : isLinkVideo && url ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground max-w-md">
                Este vídeo não permite visualização incorporada.
              </p>
            </div>
          ) : type === "pdf" && url ? (
            <object
              data={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              type="application/pdf"
              className="w-full h-full"
              aria-label={title}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Seu navegador bloqueou a visualização do PDF.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} size="sm">
                    <Printer className="w-4 h-4 mr-2" /> Imprimir
                  </Button>
                  {allowDownload && (
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" /> Baixar
                    </Button>
                  )}
                </div>
              </div>
            </object>
          ) : type === "image" && url ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40 p-4">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                draggable={false}
              />
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
    </Dialog>
  );
};

export default ContentViewerModal;
