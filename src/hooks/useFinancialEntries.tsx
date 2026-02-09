import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type FinancialEntry = Tables<"financial_entries">;
export type FinancialEntryInsert = TablesInsert<"financial_entries">;

export function useFinancialEntries(filters?: {
  type?: "pagar" | "receber";
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["financial_entries", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("financial_entries")
        .select("*")
        .eq("company_id", companyId)
        .order("due_date", { ascending: true });

      if (filters?.type) query = query.eq("type", filters.type);
      if (filters?.status) query = query.eq("status", filters.status as any);
      if (filters?.startDate) query = query.gte("due_date", filters.startDate);
      if (filters?.endDate) query = query.lte("due_date", filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialEntry[];
    },
    enabled: !!companyId,
  });
}

export function useCreateFinancialEntry() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (entry: Omit<FinancialEntryInsert, "company_id" | "created_by">) => {
      if (!companyId || !user) throw new Error("Sem permissão");
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({ ...entry, company_id: companyId, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_entries"] });
      toast.success("Lançamento criado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateFinancialEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_entries"] });
      toast.success("Lançamento atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteFinancialEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_entries"] });
      toast.success("Lançamento excluído");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_amount, payment_method }: { id: string; paid_amount: number; payment_method?: string }) => {
      const { data, error } = await supabase
        .from("financial_entries")
        .update({
          status: "pago" as any,
          paid_amount,
          paid_date: new Date().toISOString().split("T")[0],
          payment_method,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_entries"] });
      toast.success("Marcado como pago");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
