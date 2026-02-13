/**
 * useLocalClients — local-first Clients hook.
 * Reads/writes from SQLite DataLayer.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface LocalClient {
  id: string;
  company_id: string;
  name: string;
  cpf_cnpj: string | null;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  tipo_pessoa: string;
  trade_name: string | null;
  ie: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_ibge_code: string | null;
  credit_limit: number | null;
  credit_balance: number | null;
  loyalty_points: number;
  notes: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function useLocalClients() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["local-clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await DataLayer.select<LocalClient>("clients", {
        where: { company_id: companyId },
        orderBy: "name ASC",
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateLocalClient() {
  const qc = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (client: Omit<LocalClient, "id" | "company_id" | "created_at" | "updated_at">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const result = await DataLayer.insert<LocalClient>("clients", {
        ...client,
        company_id: companyId,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-clients"] });
      toast.success("Cliente criado localmente");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateLocalClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LocalClient> & { id: string }) => {
      const result = await DataLayer.update("clients", id, updates);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-clients"] });
      toast.success("Cliente atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteLocalClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await DataLayer.delete("clients", id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-clients"] });
      toast.success("Cliente excluído");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
