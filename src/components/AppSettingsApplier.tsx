import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";

/**
 * Aplica configurações de tema do admin como CSS vars na raiz.
 */
const AppSettingsApplier = () => {
  const { settings } = useAppSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.primary_color) root.style.setProperty("--primary", settings.primary_color);
    if (settings.background_color) root.style.setProperty("--background", settings.background_color);
    if (settings.text_color) root.style.setProperty("--foreground", settings.text_color);

    if (settings.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings]);

  return null;
};

export default AppSettingsApplier;