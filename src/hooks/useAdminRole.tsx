import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Module-level cache so navigation doesn't re-flash
let cachedResult: { userId: string; isSuperAdmin: boolean } | null = null;

export function useAdminRole() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(() =>
    cachedResult && user && cachedResult.userId === user.id ? cachedResult.isSuperAdmin : false
  );
  const [loading, setLoading] = useState(() =>
    cachedResult && user && cachedResult.userId === user.id ? false : true
  );

  useEffect(() => {
    if (!user) {
      cachedResult = null;
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    // If already cached for this user, use it immediately
    if (cachedResult && cachedResult.userId === user.id) {
      setIsSuperAdmin(cachedResult.isSuperAdmin);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .limit(1);

      const result = (data?.length ?? 0) > 0;
      cachedResult = { userId: user.id, isSuperAdmin: result };
      setIsSuperAdmin(result);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isSuperAdmin, loading };
}
