import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type DailyClosing = Tables<"daily_closings">;

export function useDailyClosings(month?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["daily_closings", companyId, month],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("daily_closings")
        .select("*")
        .eq("company_id", companyId)
        .order("closing_date", { ascending: false })
        .limit(60);

      if (month) {
        query = query.gte("closing_date", `${month}-01`).lte("closing_date", `${month}-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DailyClosing[];
    },
    enabled: !!companyId,
  });
}

export function useCreateDailyClosing() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (closing: Omit<DailyClosing, "id" | "created_at" | "company_id" | "closed_by">) => {
      if (!companyId || !user) throw new Error("Sem permissão");
      const { data, error } = await supabase
        .from("daily_closings")
        .insert({ ...closing, company_id: companyId, closed_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_closings"] });
      toast.success("Fechamento registrado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
