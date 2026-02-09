/**
 * FinancialService — business logic for financial entries (contas a pagar/receber).
 */
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type FinancialEntry = Tables<"financial_entries">;

export class FinancialService {
  static async list(companyId: string, filters?: {
    type?: "pagar" | "receber";
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
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
  }

  static async create(companyId: string, userId: string, entry: Omit<TablesInsert<"financial_entries">, "company_id" | "created_by">) {
    const { data, error } = await supabase
      .from("financial_entries")
      .insert({ ...entry, company_id: companyId, created_by: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<FinancialEntry>) {
    const { data, error } = await supabase
      .from("financial_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async markAsPaid(id: string, paidAmount: number, paymentMethod?: string) {
    return this.update(id, {
      status: "pago" as any,
      paid_amount: paidAmount,
      paid_date: new Date().toISOString().split("T")[0],
      payment_method: paymentMethod,
    });
  }

  static async delete(id: string) {
    const { error } = await supabase.from("financial_entries").delete().eq("id", id);
    if (error) throw error;
  }
}
