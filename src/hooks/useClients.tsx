import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;

export function useClients() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from("clients").select("*").eq("company_id", companyId).order("name");
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!companyId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (client: Omit<ClientInsert, "company_id">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const { data, error } = await supabase.from("clients").insert({ ...client, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente criado"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente atualizado"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente excluído"); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
