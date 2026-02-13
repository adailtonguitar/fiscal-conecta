/**
 * useLocalProducts — local-first Products hook.
 * Reads/writes from SQLite DataLayer, falls back to Supabase when online for initial hydration.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface LocalProduct {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  min_stock: number | null;
  unit: string;
  category: string | null;
  ncm: string | null;
  cfop: string | null;
  csosn: string | null;
  cst_icms: string | null;
  cst_pis: string | null;
  cst_cofins: string | null;
  aliq_icms: number | null;
  aliq_pis: number | null;
  aliq_cofins: number | null;
  origem: number | null;
  cest: string | null;
  gtin_tributavel: string | null;
  fiscal_category_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export function useLocalProducts() {
  const { companyId } = useCompany();

  const query = useQuery({
    queryKey: ["local-products", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await DataLayer.select<LocalProduct>("products", {
        where: { company_id: companyId },
        orderBy: "name ASC",
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!companyId,
  });

  return { ...query, companyId };
}

export function useCreateLocalProduct() {
  const qc = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (product: Partial<Omit<LocalProduct, "id" | "company_id" | "created_at" | "updated_at">> & { name: string; sku: string; price: number }) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const result = await DataLayer.insert<LocalProduct>("products", {
        ...product,
        company_id: companyId,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      toast.success("Produto criado localmente");
    },
    onError: (e: Error) => toast.error(`Erro ao criar produto: ${e.message}`),
  });
}

export function useUpdateLocalProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LocalProduct> & { id: string }) => {
      const result = await DataLayer.update("products", id, updates);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      toast.success("Produto atualizado");
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDeleteLocalProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await DataLayer.delete("products", id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-products"] });
      toast.success("Produto excluído");
    },
    onError: (e: Error) => toast.error(`Erro ao excluir: ${e.message}`),
  });
}
