import { Printer, ExternalLink, Download } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ContentViewerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  type: string;
  url: string | null;
  youtubeId: string | null;
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

const ContentViewerModal = ({ open, onClose, title, type, url, youtubeId }: ContentViewerModalProps) => {
  // "youtube" = link/embed (YouTube, Vimeo, Drive...).
  // "video"   = arquivo MP4/WebM hospedado direto (player nativo).
  const isLinkVideo = type === "youtube";
  const isFileVideo = type === "video";
  const isVideoType = isLinkVideo || isFileVideo;
  const videoInfo = isLinkVideo && url ? getVideoEmbed(url, youtubeId) : null;

  const handlePrint = () => {
    if (isVideoType) {
      if (url) window.open(url, "_blank");
      else if (youtubeId) window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank");
      return;
    }
    if (url) {
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    }
  };

  const handleOpenExternal = () => {
    if (isVideoType && !url && youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank");
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <h3 className="text-sm font-semibold text-foreground truncate flex-1 mr-4">{title}</h3>
          <div className="flex items-center gap-1">
            {!isVideoType && url && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrint} title="Imprimir">
                <Printer className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenExternal} title="Abrir em nova aba">
              <ExternalLink className="w-4 h-4" />
            </Button>
            {type === "pdf" && url && (
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Baixar">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-muted">
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
                Este vídeo não permite visualização incorporada. Abra em uma nova aba para assistir.
              </p>
              <Button onClick={() => window.open(url, "_blank")} size="sm">
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir em nova aba
              </Button>
            </div>
          ) : type === "pdf" && url ? (
            <object
              data={`${url}#toolbar=1&view=FitH`}
              type="application/pdf"
              className="w-full h-full"
              aria-label={title}
            >
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Seu navegador bloqueou a visualização do PDF.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.open(url, "_blank")} size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" /> Abrir em nova aba
                  </Button>
                  <a href={url} download target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Baixar
                    </Button>
                  </a>
                </div>
              </div>
            </object>
          ) : type === "image" && url ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40 p-4">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full w-auto h-auto object-contain"
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
                      Este conteúdo não permite visualização incorporada. Abra em uma nova aba para acessá-lo.
                    </p>
                    <Button onClick={() => window.open(url, "_blank")} size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" /> Abrir em nova aba
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
    </Dialog>
  );
};

export default ContentViewerModal;
