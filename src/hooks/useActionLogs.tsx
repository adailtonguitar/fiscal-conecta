import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCompany } from "./useCompany";

export interface ActionLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  module: string;
  details: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useActionLogs() {
  const { user } = useAuth();
  const { companyId } = useCompany();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["action-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("action_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as ActionLog[];
    },
    enabled: !!companyId,
  });

  const logAction = useCallback(
    async (action: string, module: string, details?: string, metadata?: Record<string, unknown>) => {
      if (!user || !companyId) return;
      const profile = user.user_metadata?.full_name || user.email || "Usuário";
      await supabase.from("action_logs").insert({
        company_id: companyId,
        user_id: user.id,
        user_name: profile,
        action,
        module,
        details,
        metadata: metadata as any,
      });
    },
    [user, companyId]
  );

  return { logs, isLoading, logAction };
}
