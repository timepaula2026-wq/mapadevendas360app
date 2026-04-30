import { Award, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CertificateModalProps {
  open: boolean;
  onClose: () => void;
  consultantName: string;
  achievementTitle: string;
  subtitle?: string;
  scope: "tab" | "section" | "global";
  issuedAt?: string;
}

const CertificateModal = ({
  open,
  onClose,
  consultantName,
  achievementTitle,
  subtitle,
  scope,
  issuedAt,
}: CertificateModalProps) => {
  const dateText = (issuedAt ? new Date(issuedAt) : new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const headline =
    scope === "global"
      ? "🏆 Trilha Completa!"
      : scope === "section"
      ? "🎉 Seção Concluída!"
      : "🎯 Aba Concluída!";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-primary/30">
        <div className="relative bg-gradient-to-br from-[hsl(348,70%,35%)] via-[hsl(345,65%,30%)] to-[hsl(340,65%,22%)] px-6 py-8 text-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Sparkles className="w-full h-full text-white" />
          </div>
          <div className="relative">
            <div className="mx-auto w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 ring-4 ring-white/20">
              <Award className="w-11 h-11 text-yellow-300" />
            </div>
            <p className="text-white/80 text-xs uppercase tracking-widest mb-1">Certificado</p>
            <h2 className="text-white text-2xl font-bold">{headline}</h2>
          </div>
        </div>

        <div className="px-6 py-6 text-center bg-card">
          <p className="text-xs text-muted-foreground mb-1">Conferido a</p>
          <p className="text-lg font-bold text-foreground mb-4">{consultantName}</p>

          <p className="text-sm text-muted-foreground mb-1">
            por concluir
          </p>
          <p className="text-base font-semibold text-primary mb-4 px-2">
            {achievementTitle}
          </p>

          {subtitle && (
            <p className="text-xs text-muted-foreground italic mb-4">{subtitle}</p>
          )}

          <div className="border-t border-border pt-4 mt-2">
            <p className="text-[11px] text-muted-foreground">
              Emitido em {dateText}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Mapa de Vendas · Trilha do Iniciante
            </p>
          </div>

          <Button onClick={onClose} className="mt-5 w-full" size="lg">
            Continuar minha jornada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateModal;