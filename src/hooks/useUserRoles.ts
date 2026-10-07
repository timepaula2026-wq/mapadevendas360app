import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Hierarquia de papéis: cada papel concede acesso acumulado aos inferiores.
// Ex: supervisor → também tem iniciante e autorizado implicitamente.
const ROLE_HIERARCHY: Record<string, string[]> = {
  admin:          ["admin", "secretaria", "gestor", "supervisor", "autorizado", "iniciante"],
  secretaria:     ["secretaria", "gestor", "supervisor", "autorizado", "iniciante"],
  gestor:         ["gestor", "supervisor", "autorizado", "iniciante"],
  supervisor:     ["supervisor", "autorizado", "iniciante"],
  autorizado:     ["autorizado", "iniciante"],
  iniciante:      ["iniciante"],
  escola_lideres: ["escola_lideres"],
};

/** Expande os papéis reais do usuário com todos os papéis que eles implicam. */
export function expandRoles(rawRoles: string[]): string[] {
  const expanded = new Set<string>(rawRoles);
  for (const role of rawRoles) {
    const implied = ROLE_HIERARCHY[role] ?? [];
    implied.forEach((r) => expanded.add(r));
  }
  return Array.from(expanded);
}

export const useUserRoles = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!active) return;
        const raw = (data || []).map((r: { role: string }) => r.role);
        setRoles(expandRoles(raw));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return { roles, loading };
};