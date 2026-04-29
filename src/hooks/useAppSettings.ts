import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  header_title: string;
  header_logo_url: string | null;
  header_alignment: string;
  show_header: boolean;
  display_mode: string;
  favicon_url: string | null;
  grid_cols_mobile: number;
  grid_cols_tablet: number;
  grid_cols_desktop: number;
  icon_size_mobile: number;
  icon_size_tablet: number;
  icon_size_desktop: number;
}

const DEFAULT: AppSettings = {
  id: "default",
  primary_color: "348 70% 35%",
  background_color: "0 0% 7%",
  text_color: "0 0% 98%",
  header_title: "Mapa de Vendas",
  header_logo_url: null,
  header_alignment: "center",
  show_header: true,
  display_mode: "grid",
  favicon_url: null,
  grid_cols_mobile: 2,
  grid_cols_tablet: 3,
  grid_cols_desktop: 5,
  icon_size_mobile: 36,
  icon_size_tablet: 48,
  icon_size_desktop: 56,
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (active && data) setSettings(data as AppSettings);
      if (active) setLoading(false);
    };
    fetchSettings();

    const channel = supabase
      .channel("app-settings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        () => fetchSettings()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
};