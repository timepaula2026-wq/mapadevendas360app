import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useIsAdmin } from "./useIsAdmin";

export const useApprovalCheck = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setApproved(null);
      setMustChangePassword(false);
      setLoading(false);
      return;
    }

    // Admins are always approved
    if (isAdmin) {
      setApproved(true);
      setMustChangePassword(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("approved, must_change_password")
        .eq("user_id", user.id)
        .single();
      setApproved(data?.approved ?? false);
      setMustChangePassword(!!data?.must_change_password);
      setLoading(false);
    };

    check();
  }, [user, isAdmin]);

  return { approved, loading, mustChangePassword, refresh: () => setMustChangePassword(false) };
};
