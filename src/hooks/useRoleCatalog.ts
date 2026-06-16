import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/lib/roles";

export interface RoleItem { value: string; label: string }

export const useRoleCatalog = () => {
  const [roles, setRoles] = useState<RoleItem[]>(ROLES as unknown as RoleItem[]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("role_catalog" as any).select("value,label").order("label");
    if (data && Array.isArray(data)) {
      const merged = new Map<string, string>();
      (ROLES as readonly { value: string; label: string }[]).forEach((r) => merged.set(r.value, r.label));
      (data as { value: string; label: string }[]).forEach((r) => merged.set(r.value, r.label));
      setRoles(Array.from(merged, ([value, label]) => ({ value, label })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { roles, loading, reload: load };
};
