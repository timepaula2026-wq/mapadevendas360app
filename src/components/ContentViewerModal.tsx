import { X, Printer, ExternalLink, Download } from "lucide-react";
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

const ContentViewerModal = ({ open, onClose, title, type, url, youtubeId }: ContentViewerModalProps) => {
  const handlePrint = () => {
    if (type === "youtube" && youtubeId) {
      // Can't print video, open in new tab instead
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank");
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
    if (type === "youtube" && youtubeId) {
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
            {type !== "youtube" && url && (
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
          {type === "youtube" && youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&autoplay=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
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
          ) : url ? (
            <iframe
              src={url}
              className="w-full h-full"
              title={title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
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
