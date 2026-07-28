import { Capacitor } from "@capacitor/core";

export const MOBILE_URL_SCHEME = "mapadevendas";
export const SUPPORT_EVENT_NAME = "mapa-de-vendas:open-support";
export const WEB_APP_ORIGIN = "https://mapadevendas.app";

export const isNativeApp = () => {
  try {
    if (Capacitor.isNativePlatform?.()) return true;
  } catch {
    // ignore
  }
  if (typeof window === "undefined") return false;
  return window.location.protocol === "capacitor:";
};

export const getPasswordRecoveryRedirectUrl = () => {
  if (typeof window === "undefined") return "/reset-password";
  return isNativeApp()
    ? `${MOBILE_URL_SCHEME}://reset-password`
    : `${WEB_APP_ORIGIN}/reset-password`;
};

export const getAuthEmailRedirectUrl = () => `${WEB_APP_ORIGIN}/`;

export const parseMobileDeepLink = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    const isCustomScheme = url.protocol === `${MOBILE_URL_SCHEME}:`;
    const isAllowedWebHost = ["mapadevendas.app", "www.mapadevendas.app"].includes(url.hostname);

    if (!isCustomScheme && !isAllowedWebHost) return null;

    let path = url.pathname || "/";
    if (isCustomScheme) {
      path = url.hostname && url.hostname !== "app" ? `/${url.hostname}${url.pathname}` : url.pathname || "/";
    }
    if (!path.startsWith("/")) path = `/${path}`;

    if (path === "/suporte") path = "/support";
    return `${path}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};