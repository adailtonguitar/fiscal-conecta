/**
 * usePromotions — loads active promotions for the company and provides CRUD.
 */
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import type { Promotion } from "@/services/PromotionEngine";
import { toast } from "sonner";

export function usePromotions(options?: { onlyActive?: boolean }) {
  const { companyId } = useCompany();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Load promotions
      let query = supabase
        .from("promotions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (options?.onlyActive) {
        query = query.eq("is_active", true);
      }

      const { data: promos, error } = await query;

      if (error) throw error;

      // Load promotion items to map product_ids
      const { data: items } = await supabase
        .from("promotion_items")
        .select("promotion_id, product_id")
        .eq("company_id", companyId);

      const itemMap = new Map<string, string[]>();
      for (const item of items || []) {
        const list = itemMap.get(item.promotion_id) || [];
        list.push(item.product_id);
        itemMap.set(item.promotion_id, list);
      }

      const enriched: Promotion[] = (promos || []).map((p: any) => ({
        ...p,
        product_ids: itemMap.get(p.id) || [],
      }));

      setPromotions(enriched);
    } catch (err: any) {
      console.error("[usePromotions] load error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const activePromotions = promotions.filter((p) => p.is_active);

  const createPromotion = useCallback(async (data: {
    name: string;
    description?: string;
    promo_type: string;
    discount_percent?: number;
    fixed_price?: number;
    buy_quantity?: number;
    pay_quantity?: number;
    scope: string;
    category_name?: string;
    min_quantity?: number;
    starts_at: string;
    ends_at?: string;
    active_days?: number[];
    product_ids?: string[];
  }) => {
    if (!companyId) return;

    const { product_ids, ...promoData } = data;

    const { data: created, error } = await supabase
      .from("promotions")
      .insert({ ...promoData, company_id: companyId } as any)
      .select("id")
      .single();

    if (error) {
      toast.error("Erro ao criar promoção: " + error.message);
      throw error;
    }

    // Insert product links
    if (product_ids && product_ids.length > 0) {
      const { error: itemErr } = await supabase
        .from("promotion_items")
        .insert(product_ids.map((pid) => ({
          promotion_id: created.id,
          product_id: pid,
          company_id: companyId,
        })) as any);

      if (itemErr) console.error("[usePromotions] item insert error:", itemErr.message);
    }

    toast.success("Promoção criada!");
    await load();
    return created.id;
  }, [companyId, load]);

  const togglePromotion = useCallback(async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("promotions")
      .update({ is_active: isActive } as any)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar promoção");
      return;
    }
    toast.success(isActive ? "Promoção ativada" : "Promoção desativada");
    await load();
  }, [load]);

  const deletePromotion = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir promoção");
      return;
    }
    toast.success("Promoção excluída");
    await load();
  }, [load]);

  return {
    promotions,
    activePromotions,
    loading,
    reload: load,
    createPromotion,
    togglePromotion,
    deletePromotion,
  };
}
