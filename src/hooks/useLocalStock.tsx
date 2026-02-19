/**
 * useLocalStock — local-first Stock movements hook.
 * CRUD on SQLite + automatic product stock update.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer, getDB } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LocalStockMovement {
  id: string;
  company_id: string;
  product_id: string;
  type: string; // 'entrada' | 'saida' | 'ajuste' | 'venda' | 'devolucao'
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number | null;
  reason: string | null;
  reference: string | null;
  performed_by: string;
  created_at: string;
  synced_at: string | null;
}

export function useLocalStockMovements(productId?: string) {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["local-stock-movements", companyId, productId],
    queryFn: async () => {
      if (!companyId) return [];
      const where: Record<string, unknown> = { company_id: companyId };
      if (productId) where.product_id = productId;
      const result = await DataLayer.select<LocalStockMovement>("stock_movements", {
        where,
        orderBy: "created_at DESC",
        limit: 200,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!companyId,
  });
}

export function useRegisterLocalStockMovement() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      product_id: string;
      type: "entrada" | "saida" | "ajuste" | "venda" | "devolucao";
      quantity: number;
      unit_cost?: number;
      new_price?: number;
      reason?: string;
      reference?: string;
    }) => {
      if (!companyId || !user) throw new Error("Contexto inválido");

      const db = await getDB();

      // Get current stock
      const prodResult = await db.query(
        `SELECT stock_quantity FROM products WHERE id = ?`,
        [input.product_id]
      );
      const rows = prodResult.values || [];
      if (rows.length === 0) throw new Error("Produto não encontrado");

      const previous = Number(rows[0].stock_quantity);
      let newStock: number;

      switch (input.type) {
        case "entrada":
        case "devolucao":
          newStock = previous + input.quantity;
          break;
        case "saida":
        case "venda":
          newStock = previous - input.quantity;
          break;
        case "ajuste":
          newStock = input.quantity;
          break;
        default:
          newStock = previous;
      }

      // Insert movement
      const result = await DataLayer.insert<LocalStockMovement>("stock_movements", {
        company_id: companyId,
        product_id: input.product_id,
        type: input.type,
        quantity: input.type === "ajuste" ? Math.abs(input.quantity - previous) : input.quantity,
        previous_stock: previous,
        new_stock: newStock,
        unit_cost: input.unit_cost ?? null,
        reason: input.reason ?? null,
        reference: input.reference ?? null,
        performed_by: user.id,
      });

      if (result.error) throw new Error(result.error);

      // Update product stock and optionally price/cost
      const updateFields: Record<string, unknown> = { stock_quantity: newStock };
      if (input.unit_cost && input.unit_cost > 0) {
        updateFields.cost_price = input.unit_cost;
      }
      if (input.new_price && input.new_price > 0) {
        updateFields.price = input.new_price;
      }
      await DataLayer.update("products", input.product_id, updateFields);

      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-stock-movements"] });
      qc.invalidateQueries({ queryKey: ["local-products"] });
      toast.success("Movimentação registrada");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
