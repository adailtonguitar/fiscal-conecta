/**
 * useLocalSales — local-first Sales (fiscal_documents) hook.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LocalSale {
  id: string;
  company_id: string;
  doc_type: string;
  status: string;
  total_value: number;
  payment_method: string | null;
  items_json: string | null; // JSON string in SQLite
  customer_cpf_cnpj: string | null;
  customer_name: string | null;
  number: number | null;
  serie: number | null;
  access_key: string | null;
  protocol_number: string | null;
  issued_by: string | null;
  is_contingency: number;
  environment: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export function useLocalSales(limit = 50) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["local-sales", companyId, limit],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await DataLayer.select<LocalSale>("fiscal_documents", {
        where: { company_id: companyId },
        orderBy: "created_at DESC",
        limit,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateLocalSale() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (sale: {
      total_value: number;
      payment_method: string;
      items: unknown[];
      customer_cpf_cnpj?: string;
      customer_name?: string;
      doc_type?: string;
    }) => {
      if (!companyId || !user) throw new Error("Contexto inválido");

      const result = await DataLayer.insert<LocalSale>("fiscal_documents", {
        company_id: companyId,
        doc_type: sale.doc_type || "nfce",
        status: "pendente",
        total_value: sale.total_value,
        payment_method: sale.payment_method,
        items_json: JSON.stringify(sale.items),
        customer_cpf_cnpj: sale.customer_cpf_cnpj ?? null,
        customer_name: sale.customer_name ?? null,
        issued_by: user.id,
        is_contingency: 0,
        environment: "homologacao",
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-sales"] });
      toast.success("Venda registrada localmente");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
