/**
 * StockService — business logic for stock movements, decoupled from UI.
 */
import { supabase } from "@/integrations/supabase/client";
import type { StockMovementInput } from "./types";

export class StockService {
  /**
   * Register a stock movement and update product stock.
   * The DB trigger `update_product_stock` handles the stock_quantity update.
   */
  static async registerMovement(params: {
    companyId: string;
    userId: string;
    movement: StockMovementInput;
  }) {
    const { companyId, userId, movement } = params;

    // Get current stock
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", movement.product_id)
      .single();

    if (pErr) throw new Error(`Produto não encontrado: ${pErr.message}`);

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
        newStock = movement.quantity; // absolute value
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
        performed_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(`Erro na movimentação: ${error.message}`);
    return data;
  }
}
