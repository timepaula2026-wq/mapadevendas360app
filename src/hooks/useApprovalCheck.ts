import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useIsAdmin";

export const useApprovalCheck = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setApproved(null);
      setLoading(false);
      return;
    }

    // Admins are always approved
    if (isAdmin) {
      setApproved(true);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", user.id)
        .single();
      setApproved(data?.approved ?? false);
      setLoading(false);
    };

    check();
  }, [user, isAdmin]);

  return { approved, loading };
};
