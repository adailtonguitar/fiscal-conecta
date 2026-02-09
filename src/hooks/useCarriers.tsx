import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Carrier = Tables<"carriers">;
export type CarrierInsert = TablesInsert<"carriers">;

export function useCarriers() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["carriers", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("carriers").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data as Carrier[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCarrier() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (c: Omit<CarrierInsert, "company_id">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const { data, error } = await supabase.from("carriers").insert({ ...c, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["carriers"] }); toast.success("Transportadora criada"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Carrier> & { id: string }) => {
      const { data, error } = await supabase.from("carriers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["carriers"] }); toast.success("Transportadora atualizada"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteCarrier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carriers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["carriers"] }); toast.success("Transportadora excluída"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
