import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Conta quantos conteúdos cada section_id possui (em uma lista informada).
 * Usado para calcular o progresso de cada aba/seção da Trilha do Iniciante.
 */
export const useSectionsCounts = (sectionIds: string[]) => {
  const key = sectionIds.join(",");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (sectionIds.length === 0) {
      setCounts({});
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("section_contents")
        .select("section_id")
        .in("section_id", sectionIds);
      if (!active) return;
      const acc: Record<string, number> = {};
      sectionIds.forEach((id) => (acc[id] = 0));
      (data || []).forEach((r: { section_id: string }) => {
        acc[r.section_id] = (acc[r.section_id] || 0) + 1;
      });
      setCounts(acc);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { counts, loading };
};