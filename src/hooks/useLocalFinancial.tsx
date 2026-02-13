/**
 * useLocalFinancial — local-first Financial entries hook.
 * CRUD operations on SQLite for contas a pagar/receber.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export interface LocalFinancialEntry {
  id: string;
  company_id: string;
  type: string; // 'pagar' | 'receber'
  category: string;
  status: string; // 'pendente' | 'pago' | 'vencido' | 'cancelado'
  description: string;
  amount: number;
  paid_amount: number | null;
  due_date: string;
  paid_date: string | null;
  payment_method: string | null;
  counterpart: string | null;
  cost_center: string | null;
  reference: string | null;
  recurrence: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export function useLocalFinancialEntries(filters?: {
  type?: "pagar" | "receber";
  startDate?: string;
  endDate?: string;
}) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["local-financial", companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];
      let sql = `SELECT * FROM financial_entries WHERE company_id = ?`;
      const values: unknown[] = [companyId];

      if (filters?.type) {
        sql += ` AND type = ?`;
        values.push(filters.type);
      }
      if (filters?.startDate) {
        sql += ` AND due_date >= ?`;
        values.push(filters.startDate);
      }
      if (filters?.endDate) {
        sql += ` AND due_date <= ?`;
        values.push(filters.endDate);
      }

      sql += ` ORDER BY due_date ASC`;

      const result = await DataLayer.raw<LocalFinancialEntry>(sql, values);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateLocalFinancialEntry() {
  const qc = useQueryClient();
  const { companyId } = useCompany();

  return useMutation({
    mutationFn: async (entry: Omit<LocalFinancialEntry, "id" | "company_id" | "created_at" | "updated_at" | "synced_at">) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const result = await DataLayer.insert<LocalFinancialEntry>("financial_entries", {
        ...entry,
        company_id: companyId,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-financial"] });
      toast.success("Lançamento criado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateLocalFinancialEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LocalFinancialEntry> & { id: string }) => {
      const result = await DataLayer.update("financial_entries", id, updates);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-financial"] });
      toast.success("Lançamento atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteLocalFinancialEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await DataLayer.delete("financial_entries", id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-financial"] });
      toast.success("Lançamento excluído");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useMarkAsLocalPaid() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_amount, payment_method }: { id: string; paid_amount: number; payment_method?: string }) => {
      const result = await DataLayer.update("financial_entries", id, {
        status: "pago",
        paid_amount,
        paid_date: new Date().toISOString().split("T")[0],
        payment_method: payment_method || "dinheiro",
      });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-financial"] });
      toast.success("Marcado como pago");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
