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
}

export const useSectionContents = (sectionId: string) => {
  const [contents, setContents] = useState<SectionContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("section_contents")
        .select("*")
        .eq("section_id", sectionId)
        .order("sort_order", { ascending: true });
      setContents((data as SectionContent[]) || []);
      setLoading(false);
    };
    fetch();
  }, [sectionId]);

  return { contents, loading };
};
