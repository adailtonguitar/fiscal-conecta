import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsReseller() {
  const { user } = useAuth();
  const [isReseller, setIsReseller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsReseller(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { count } = await supabase
        .from("resellers")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", user.id)
        .eq("is_active", true);

      setIsReseller((count ?? 0) > 0);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isReseller, loading };
}
