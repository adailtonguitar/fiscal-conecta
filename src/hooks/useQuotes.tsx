/**
 * useQuotes — hook for managing quotes (orçamentos).
 */
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Quote {
  id: string;
  quote_number: number;
  client_id: string | null;
  client_name: string | null;
  items_json: any[];
  subtotal: number;
  discount_percent: number;
  discount_value: number;
  total: number;
  notes: string | null;
  status: string;
  valid_until: string | null;
  created_by: string;
  converted_sale_id: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useQuotes(options?: { skipInitialFetch?: boolean }) {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(!options?.skipInitialFetch);

  const fetchQuotes = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) setQuotes(data as unknown as Quote[]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!options?.skipInitialFetch) {
      fetchQuotes();
    }
  }, [fetchQuotes, options?.skipInitialFetch]);

  const createQuote = useCallback(async (params: {
    items: any[];
    subtotal: number;
    discountPercent: number;
    discountValue: number;
    total: number;
    clientName?: string;
    clientId?: string;
    notes?: string;
    validDays?: number;
  }) => {
    if (!companyId || !user) throw new Error("Dados incompletos");

    const validUntil = params.validDays
      ? new Date(Date.now() + params.validDays * 86400000).toISOString().split("T")[0]
      : null;

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        company_id: companyId,
        created_by: user.id,
        items_json: params.items as any,
        subtotal: params.subtotal,
        discount_percent: params.discountPercent,
        discount_value: params.discountValue,
        total: params.total,
        client_name: params.clientName || null,
        client_id: params.clientId || null,
        notes: params.notes || null,
        valid_until: validUntil,
        status: "pendente",
      } as any)
      .select()
      .single();

    if (error) throw error;
    await fetchQuotes();
    return data;
  }, [companyId, user, fetchQuotes]);

  const updateQuoteStatus = useCallback(async (quoteId: string, status: string) => {
    const { error } = await supabase
      .from("quotes")
      .update({ status } as any)
      .eq("id", quoteId);
    if (error) throw error;
    await fetchQuotes();
  }, [fetchQuotes]);

  const deleteQuote = useCallback(async (quoteId: string) => {
    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", quoteId);
    if (error) throw error;
    await fetchQuotes();
  }, [fetchQuotes]);

  return {
    quotes,
    loading,
    fetchQuotes,
    createQuote,
    updateQuoteStatus,
    deleteQuote,
  };
}
