import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ProductLabel {
  id: string;
  product_id: string;
  company_id: string;
  status: "pendente" | "impressa";
  last_printed_at: string | null;
  printed_by: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    barcode: string | null;
    sku: string;
    unit: string;
    category: string | null;
  };
}

export function useProductLabels(statusFilter?: "pendente" | "impressa" | "todas") {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["product_labels", companyId, statusFilter],
    queryFn: async () => {
      if (!companyId) return [];

      let query = (supabase as any)
        .from("product_labels")
        .select("*, product:products(id, name, price, barcode, sku, unit, category)")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false });

      if (statusFilter && statusFilter !== "todas") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProductLabel[];
    },
    enabled: !!companyId,
  });
}

export function useMarkLabelsPrinted() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (labelIds: string[]) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await (supabase as any)
        .from("product_labels")
        .update({
          status: "impressa",
          last_printed_at: new Date().toISOString(),
          printed_by: user.id,
        })
        .in("id", labelIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_labels"] });
      toast.success("Etiquetas marcadas como impressas");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useResetLabels() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (labelIds: string[]) => {
      const { error } = await (supabase as any)
        .from("product_labels")
        .update({ status: "pendente", last_printed_at: null, printed_by: null })
        .in("id", labelIds);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_labels"] });
      toast.success("Etiquetas marcadas como pendentes");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
