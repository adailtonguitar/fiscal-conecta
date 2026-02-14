/**
 * PromotionEngine — calculates automatic discounts for PDV cart items.
 * Pure logic, no side effects.
 */

export interface Promotion {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  promo_type: "percentual" | "leve_x_pague_y" | "preco_fixo";
  discount_percent: number;
  fixed_price: number;
  buy_quantity: number;
  pay_quantity: number;
  scope: "product" | "category";
  category_name: string | null;
  min_quantity: number;
  starts_at: string;
  ends_at: string | null;
  active_days: number[] | null;
  is_active: boolean;
  product_ids?: string[]; // populated from promotion_items
}

export interface CartItemForPromo {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  category: string | null;
}

export interface AppliedPromo {
  promotionId: string;
  promotionName: string;
  promoType: string;
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  savings: number; // per unit
  totalSavings: number; // savings * qty (or adjusted for leve_x_pague_y)
}

export class PromotionEngine {
  /**
   * Given active promotions and cart items, returns the best discount per product.
   * If multiple promotions apply, picks the one with the highest savings.
   */
  static apply(promotions: Promotion[], cartItems: CartItemForPromo[]): AppliedPromo[] {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun

    // Filter promotions that are currently valid
    const activePromos = promotions.filter((p) => {
      if (!p.is_active) return false;
      if (new Date(p.starts_at) > now) return false;
      if (p.ends_at && new Date(p.ends_at) < now) return false;
      if (p.active_days && p.active_days.length > 0 && !p.active_days.includes(dayOfWeek)) return false;
      return true;
    });

    const results: AppliedPromo[] = [];

    for (const item of cartItems) {
      // Find all promotions matching this item
      const matching = activePromos.filter((p) => {
        if (p.scope === "product") {
          return p.product_ids?.includes(item.id);
        }
        if (p.scope === "category") {
          return item.category && item.category.toLowerCase() === p.category_name?.toLowerCase();
        }
        return false;
      });

      if (matching.length === 0) continue;

      // Calculate savings for each matching promo and pick the best
      let bestPromo: AppliedPromo | null = null;

      for (const promo of matching) {
        const applied = this.calculateDiscount(promo, item);
        if (applied && (!bestPromo || applied.totalSavings > bestPromo.totalSavings)) {
          bestPromo = applied;
        }
      }

      if (bestPromo) {
        results.push(bestPromo);
      }
    }

    return results;
  }

  private static calculateDiscount(promo: Promotion, item: CartItemForPromo): AppliedPromo | null {
    switch (promo.promo_type) {
      case "percentual": {
        if (item.quantity < promo.min_quantity) return null;
        const discount = item.price * (promo.discount_percent / 100);
        const discountedPrice = item.price - discount;
        return {
          promotionId: promo.id,
          promotionName: promo.name,
          promoType: "percentual",
          productId: item.id,
          originalPrice: item.price,
          discountedPrice,
          savings: discount,
          totalSavings: discount * item.quantity,
        };
      }

      case "preco_fixo": {
        if (item.quantity < promo.min_quantity) return null;
        if (promo.fixed_price >= item.price) return null; // not a real discount
        const savings = item.price - promo.fixed_price;
        return {
          promotionId: promo.id,
          promotionName: promo.name,
          promoType: "preco_fixo",
          productId: item.id,
          originalPrice: item.price,
          discountedPrice: promo.fixed_price,
          savings,
          totalSavings: savings * item.quantity,
        };
      }

      case "leve_x_pague_y": {
        const { buy_quantity, pay_quantity } = promo;
        if (buy_quantity <= 0 || pay_quantity <= 0 || pay_quantity >= buy_quantity) return null;
        if (item.quantity < buy_quantity) return null;

        // How many full sets of buy_quantity fit?
        const fullSets = Math.floor(item.quantity / buy_quantity);
        const remainder = item.quantity % buy_quantity;
        const freeUnitsPerSet = buy_quantity - pay_quantity;
        const totalFreeUnits = fullSets * freeUnitsPerSet;
        const totalSavings = totalFreeUnits * item.price;

        // Effective per-unit price
        const totalPaid = (item.quantity - totalFreeUnits) * item.price;
        const effectivePrice = totalPaid / item.quantity;

        return {
          promotionId: promo.id,
          promotionName: promo.name,
          promoType: "leve_x_pague_y",
          productId: item.id,
          originalPrice: item.price,
          discountedPrice: effectivePrice,
          savings: item.price - effectivePrice,
          totalSavings,
        };
      }

      default:
        return null;
    }
  }
}
