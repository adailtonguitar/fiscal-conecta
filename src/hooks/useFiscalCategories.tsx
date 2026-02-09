import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type FiscalCategory = Tables<"fiscal_categories">;
export type FiscalCategoryInsert = TablesInsert<"fiscal_categories">;

export function useFiscalCategories() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["fiscal_categories", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("fiscal_categories").select("*").eq("company_id", companyId).order("type").order("code");
      if (error) throw error;
      return data as FiscalCategory[];
    },
    enabled: !!companyId,
  });
}

export function useCreateFiscalCategory() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (c: Omit<FiscalCategoryInsert, "company_id">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const { data, error } = await supabase.from("fiscal_categories").insert({ ...c, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscal_categories"] }); toast.success("Categoria fiscal criada"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateFiscalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FiscalCategory> & { id: string }) => {
      const { data, error } = await supabase.from("fiscal_categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscal_categories"] }); toast.success("Categoria fiscal atualizada"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteFiscalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fiscal_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscal_categories"] }); toast.success("Categoria fiscal excluída"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
