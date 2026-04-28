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
    const fetch = async () => {
      const [{ data: contentsData }, { data: tabsData }] = await Promise.all([
        supabase
          .from("section_contents")
          .select("*")
          .eq("section_id", sectionId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("section_tabs")
          .select("*")
          .eq("section_id", sectionId)
          .order("sort_order", { ascending: true }),
      ]);
      setContents((contentsData as SectionContent[]) || []);
      setTabs((tabsData as SectionTab[]) || []);
      setLoading(false);
    };
    fetch();
  }, [sectionId]);

  return { contents, tabs, loading };
};
