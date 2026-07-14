import { Download, AlertTriangle } from "lucide-react";
import { APK_DOWNLOAD_URL, isLikelyOldAndroidApk } from "@/lib/appUpdate";

/**
 * Banner exibido no topo do app avisando sobre nova versão do APK Android.
 * Aparece sempre no web/PWA para todos verem, e é destacado quando detectamos
 * um APK antigo rodando localmente.
 */
export default function AppUpdateBanner() {
  const isOldApk = isLikelyOldAndroidApk();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAndroid = /Android/i.test(ua);

  // Só mostra em Android (celular). Em iOS/desktop o app já atualiza sozinho.
  if (!isAndroid) return null;

  return (
    <div
      className={`w-full ${
        isOldApk ? "bg-destructive text-destructive-foreground" : "bg-primary/90 text-primary-foreground"
      } px-4 py-2 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md`}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-center">
        {isOldApk
          ? "Sua versão do app está desatualizada. Baixe a nova versão para continuar usando sem erros."
          : "Nova versão do app para Android disponível."}
      </span>
      <a
        href={APK_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md bg-background/20 hover:bg-background/30 px-2 py-1 font-semibold whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" /> Baixar
      </a>
    </div>
  );
}