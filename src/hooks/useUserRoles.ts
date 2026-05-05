import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

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
        setRoles((data || []).map((r: { role: string }) => r.role));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  return { roles, loading };
};