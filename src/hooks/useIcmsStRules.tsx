import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface IcmsStRule {
  id: string;
  company_id: string;
  fiscal_category_id: string | null;
  uf_origin: string;
  uf_destination: string;
  mva_original: number;
  mva_adjusted: number | null;
  icms_internal_rate: number;
  icms_interstate_rate: number;
  ncm: string | null;
  cest: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useIcmsStRules() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["icms_st_rules", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("icms_st_rules" as any)
        .select("*")
        .eq("company_id", companyId)
        .order("uf_destination");
      if (error) throw error;
      return (data as any[]) as IcmsStRule[];
    },
    enabled: !!companyId,
  });
}

export function useCreateIcmsStRule() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (rule: Omit<IcmsStRule, "id" | "company_id" | "created_at" | "updated_at">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const { data, error } = await supabase
        .from("icms_st_rules" as any)
        .insert({ ...rule, company_id: companyId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["icms_st_rules"] });
      toast.success("Regra ICMS-ST criada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateIcmsStRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IcmsStRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("icms_st_rules" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["icms_st_rules"] });
      toast.success("Regra ICMS-ST atualizada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteIcmsStRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("icms_st_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["icms_st_rules"] });
      toast.success("Regra ICMS-ST excluída");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
