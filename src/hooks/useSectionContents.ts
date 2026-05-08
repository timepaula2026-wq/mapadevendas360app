import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SectionContent {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  youtube_id: string | null;
  sort_order: number | null;
  tab_id: string | null;
  parent_id: string | null;
  allow_download?: boolean | null;
  open_mode?: "iframe" | "newtab" | null;
  allow_user_upload?: boolean | null;
}

export interface SectionTab {
  id: string;
  section_id: string;
  title: string;
  sort_order: number | null;
}

export const useSectionContents = (sectionId: string) => {
  const [contents, setContents] = useState<SectionContent[]>([]);
  const [tabs, setTabs] = useState<SectionTab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      const [{ data: contentsData }, { data: tabsData }] = await Promise.all([
        supabase
          .from("section_contents")
          .select("*")
          .eq("section_id", sectionId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("section_tabs")
          .select("*")
          .eq("section_id", sectionId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      setContents((contentsData as SectionContent[]) || []);
      setTabs((tabsData as SectionTab[]) || []);
      setLoading(false);
    };
    fetchAll();

    const channel = supabase
      .channel(`section-${sectionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "section_tabs", filter: `section_id=eq.${sectionId}` },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "section_contents", filter: `section_id=eq.${sectionId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [sectionId]);

  return { contents, tabs, loading };
};
