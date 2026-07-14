// Configuração da versão mais nova do APK Android.
// Atualize APK_DOWNLOAD_URL e LATEST_APK_VERSION sempre que gerar um APK novo.
export const LATEST_APK_VERSION = "1.0.0";
export const APK_DOWNLOAD_URL = "https://mapadevendas.app/download-apk";

// Detecta se o app está rodando dentro de um APK antigo (bundle local, sem servidor remoto).
// Quando o Capacitor carrega o app diretamente de https://mapadevendas.app,
// window.location.hostname === "mapadevendas.app" — logo NÃO é APK antigo.
// Quando é APK velho (assets locais), o hostname é "localhost" ou vazio.
export const isLikelyOldAndroidApk = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  if (!isAndroid) return false;
  const host = window.location.hostname;
  // App shell novo carrega de mapadevendas.app; APK velho usa localhost/file
  const isLocalShell = host === "localhost" || host === "" || host === "127.0.0.1";
  return isLocalShell;
};