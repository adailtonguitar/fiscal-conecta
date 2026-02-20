import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type StockMovement = Tables<"stock_movements">;

export function useStockMovements(productId?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["stock_movements", companyId, productId],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("stock_movements")
        .select("*, products(name, sku)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      type: "entrada" | "saida" | "ajuste" | "venda" | "devolucao";
      quantity: number;
      unit_cost?: number;
      reason?: string;
      reference?: string;
    }) => {
      if (!companyId || !user) throw new Error("Sem permissão");

      // Get current stock
      const { data: product, error: pErr } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", movement.product_id)
        .single();
      if (pErr) throw pErr;

      const previous = Number(product.stock_quantity);
      let newStock: number;

      switch (movement.type) {
        case "entrada":
        case "devolucao":
          newStock = previous + movement.quantity;
          break;
        case "saida":
        case "venda":
          newStock = previous - movement.quantity;
          break;
        case "ajuste":
          newStock = movement.quantity; // absolute
          break;
        default:
          newStock = previous;
      }

      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          company_id: companyId,
          product_id: movement.product_id,
          type: movement.type,
          quantity: movement.type === "ajuste" ? Math.abs(movement.quantity - previous) : movement.quantity,
          previous_stock: previous,
          new_stock: newStock,
          unit_cost: movement.unit_cost,
          reason: movement.reason,
          reference: movement.reference,
          performed_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // stock_quantity is updated automatically by DB trigger (update_product_stock)
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["reorder_suggestions"] });
      toast.success("Movimentação registrada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
