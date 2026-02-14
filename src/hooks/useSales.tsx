import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import type { Tables } from "@/integrations/supabase/types";

export type Sale = Tables<"fiscal_documents">;

export function useSales(limit = 50) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["sales", companyId, limit],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("fiscal_documents")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!companyId,
  });
}
