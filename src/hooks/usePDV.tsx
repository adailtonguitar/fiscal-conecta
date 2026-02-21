/**
 * usePDV — self-contained PDV state management hook.
 * Consumes services and sync queue, fully offline-first.
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { useSync } from "@/hooks/useSync";
import { usePromotions } from "@/hooks/usePromotions";
import { SaleService, CashSessionService } from "@/services";
import { PromotionEngine } from "@/services/PromotionEngine";
import { DataLayer } from "@/lib/local-db";
import { cacheEntities, getCachedEntities } from "@/lib/sync-queue";
import { isScaleBarcode, parseScaleBarcode } from "@/lib/scale-barcode";
import { isNativePlatform } from "@/lib/platform";
import type { SaleItem, PaymentResult } from "@/services/types";
import type { AppliedPromo } from "@/services/PromotionEngine";
import { toast } from "sonner";

export interface PDVProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  sku: string;
  ncm: string | null;
  unit: string;
  stock_quantity: number;
  barcode: string | null;
  image_url: string | null;
  reorder_point: number | null;
}

export interface PDVCartItem extends PDVProduct {
  quantity: number;
}

export function usePDV() {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const sync = useSync();
  const { activePromotions } = usePromotions({ onlyActive: true });

  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [cartItems, setCartItems] = useState<PDVCartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [trainingMode, setTrainingMode] = useState(false);
  const [lastSaleItems, setLastSaleItems] = useState<PDVCartItem[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessionEverLoaded, setSessionEverLoaded] = useState(false);

  // Discount state: per-item discounts stored as { [productId]: percentValue }
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  // Global discount on the subtotal
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);

  const subtotal = cartItems.reduce((acc, item) => {
    const itemDiscount = itemDiscounts[item.id] || 0;
    const discountedPrice = item.price * (1 - itemDiscount / 100);
    return acc + discountedPrice * item.quantity;
  }, 0);

  const globalDiscountValue = subtotal * (globalDiscountPercent / 100);

  // Apply promotion engine
  const appliedPromos = useMemo(() => {
    if (activePromotions.length === 0 || cartItems.length === 0) return [];
    return PromotionEngine.apply(
      activePromotions,
      cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      }))
    );
  }, [activePromotions, cartItems]);

  // Total promotion savings
  const promoSavings = appliedPromos.reduce((acc, p) => acc + p.totalSavings, 0);

  const total = Math.max(0, subtotal - globalDiscountValue - promoSavings);

  // Load products — cache in sessionStorage for instant re-mount
  const loadProducts = useCallback(async () => {
    if (!companyId) return;

    // 1. Instant: load from sessionStorage cache first
    const cacheKey = `pdv_products_${companyId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PDVProduct[];
        if (parsed.length > 0) {
          setProducts(parsed);
          setLoadingProducts(false);
          // Continue to background refresh below
        }
      } catch { /* ignore corrupt cache */ }
    } else {
      setLoadingProducts(true);
    }

    // 2. Try local SQLite (only on native platforms)
    if (isNativePlatform()) {
      try {
        const result = await DataLayer.raw<PDVProduct>(
          `SELECT id, name, price, category, sku, ncm, unit, stock_quantity, barcode, image_url, reorder_point
           FROM products WHERE company_id = ? AND is_active = 1 ORDER BY name`,
          [companyId]
        );
        if (!result.error && result.data.length > 0) {
          setProducts(result.data);
          sessionStorage.setItem(cacheKey, JSON.stringify(result.data));
          setLoadingProducts(false);
          return;
        }
      } catch {
        // SQLite failed — continue to fallbacks
      }
    }

    // 3. Load from Supabase (primary source for web)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category, sku, ncm, unit, stock_quantity, barcode, image_url, reorder_point")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name")
        .limit(2000);

      if (!error && data) {
        setProducts(data as PDVProduct[]);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } else {
        console.error("[PDV] Erro ao carregar produtos:", error?.message);
      }
    } catch (err) {
      console.error("[PDV] Nenhuma fonte de produtos disponível", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, sync.isOnline]);

  // Load current cash session — accepts optional terminalId for filtering
  // Falls back to localStorage cache when offline
  const loadSession = useCallback(async (tid?: string) => {
    if (!companyId) {
      setCurrentSession(null);
      setLoadingSession(false);
      return;
    }
    setLoadingSession(true);
    try {
      const session = await CashSessionService.getCurrentSession(companyId, tid);
      setCurrentSession(session);
    } catch {
      // Fallback: try to load offline cached session
      try {
        const raw = localStorage.getItem("as_offline_cash_session");
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.company_id === companyId && cached?.status === "aberto") {
            setCurrentSession(cached);
          } else {
            setCurrentSession(null);
          }
        } else {
          setCurrentSession(null);
        }
      } catch {
        setCurrentSession(null);
      }
    } finally {
      setLoadingSession(false);
      setSessionEverLoaded(true);
    }
  }, [companyId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Cart operations — returns false if product has no stock
  const addToCart = useCallback((product: PDVProduct): boolean => {
    if (product.stock_quantity <= 0) {
      return false;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > product.stock_quantity) {
        toast.warning(`Estoque insuficiente. Disponível: ${product.stock_quantity} ${product.unit}`);
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    return true;
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setItemDiscounts({});
    setGlobalDiscountPercent(0);
  }, []);

  // Finalize sale
  const finalizeSale = useCallback(async (paymentResults: PaymentResult[]) => {
    if (!companyId || !user || cartItems.length === 0) {
      throw new Error("Dados incompletos para finalizar venda");
    }

    // Save items for "repeat last sale" before clearing
    setLastSaleItems([...cartItems]);

    // Training mode: simulate sale without persisting
    if (trainingMode) {
      const nfceNumber = "TREINO-" + String(Math.floor(Math.random() * 999999)).padStart(6, "0");
      setCartItems([]);
      setItemDiscounts({});
      setGlobalDiscountPercent(0);
      toast.info("🎓 Venda simulada (modo treinamento) — nenhum dado foi salvo.");
      return { fiscalDocId: `training-${Date.now()}`, nfceNumber };
    }

    const items: SaleItem[] = cartItems.map((item) => ({
      product_id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.price,
      unit: item.unit,
      ncm: item.ncm || undefined,
    }));

    // Build payment method label for fiscal document
    const paymentMethodLabel = paymentResults.length === 1
      ? paymentResults[0].method
      : paymentResults.map((p) => p.method).join("+");

    if (navigator.onLine) {
      try {
        // Extract credit client info from payment results if present
        const creditPayment = paymentResults.find(p => p.method === "prazo");

        const result = await SaleService.finalizeSale({
          companyId,
          userId: user.id,
          sessionId: currentSession?.id,
          items,
          total,
          paymentMethod: paymentMethodLabel,
          paymentResults,
          customerCpf: undefined,
          customerName: creditPayment?.credit_client_name || undefined,
        });

        toast.success("Venda finalizada! NFC-e sendo emitida...");

        setCartItems([]);
        return result;
      } catch (err: any) {
        toast.warning("Erro ao salvar online. Enfileirando para sync.");
      }
    }

    // Offline: queue for later sync
    await sync.queueOperation("sale", {
      company_id: companyId,
      user_id: user.id,
      items,
      total,
      payment_method: paymentMethodLabel,
      created_at: new Date().toISOString(),
    }, 1, 5);

    const nfceNumber = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
    setCartItems([]);
    toast.info("Venda salva localmente. Será sincronizada quando online.");
    return { fiscalDocId: `offline-${Date.now()}`, nfceNumber };
  }, [companyId, user, cartItems, total, currentSession, sync]);

  // Barcode scan handler
  // Scale barcode: find product by internal code and add with weight/price
  const handleScaleBarcode = useCallback((barcode: string): boolean => {
    const parsed = parseScaleBarcode(barcode);
    if (!parsed) return false;

    // Match product by last digits of SKU or barcode containing the product code
    const product = products.find(
      (p) =>
        p.sku === parsed.productCode ||
        p.sku.endsWith(parsed.productCode) ||
        p.barcode === parsed.productCode ||
        (p.barcode && p.barcode.endsWith(parsed.productCode))
    );

    if (!product) {
      toast.error(`Produto da balança não encontrado (código: ${parsed.productCode})`);
      return true; // consumed the barcode even if not found
    }

    if (parsed.isWeight && parsed.weightKg) {
      // Add with weight as quantity (kg)
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        const newQty = parsed.weightKg!;
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.round((item.quantity + newQty) * 1000) / 1000 }
              : item
          );
        }
        return [...prev, { ...product, quantity: Math.round(newQty * 1000) / 1000 }];
      });
      toast.success(`${product.name} — ${parsed.weightKg.toFixed(3)} kg`);
    } else if (!parsed.isWeight && parsed.priceValue) {
      // Price-encoded: calculate quantity from price ÷ unit price
      const qty = product.price > 0 ? Math.round((parsed.priceValue / product.price) * 1000) / 1000 : 1;
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.round((item.quantity + qty) * 1000) / 1000 }
              : item
          );
        }
        return [...prev, { ...product, quantity: Math.round(qty * 1000) / 1000 }];
      });
      toast.success(`${product.name} — R$ ${parsed.priceValue.toFixed(2)}`);
    }

    return true;
  }, [products]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    // Check if it's a scale barcode first
    if (isScaleBarcode(barcode)) {
      handleScaleBarcode(barcode);
      return;
    }

    const product = products.find(
      (p) => p.sku === barcode || p.barcode === barcode || p.id === barcode
    );
    if (product) {
      const added = addToCart(product);
      if (added) {
        toast.success(`${product.name} adicionado`);
      }
    } else {
      toast.error(`Produto não encontrado: ${barcode}`);
    }
  }, [products, addToCart, handleScaleBarcode]);

  return {
    // Products
    products,
    loadingProducts,
    refreshProducts: loadProducts,

    // Cart
    cartItems,
    total,
    subtotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,

    // Discounts
    itemDiscounts,
    setItemDiscount: (productId: string, percent: number) => {
      setItemDiscounts((prev) => ({ ...prev, [productId]: percent }));
    },
    globalDiscountPercent,
    setGlobalDiscountPercent,
    globalDiscountValue,

    // Promotions
    appliedPromos,
    promoSavings,

    // Sale
    finalizeSale,

    // Session
    currentSession,
    loadingSession,
    sessionEverLoaded,
    reloadSession: loadSession,

    // Barcode
    handleBarcodeScan,

    // Training mode
    trainingMode,
    setTrainingMode,

    // Last sale
    lastSaleItems,
    repeatLastSale: () => {
      if (lastSaleItems.length === 0) {
        toast.warning("Nenhuma venda anterior para repetir");
        return;
      }
      setCartItems([...lastSaleItems]);
      setItemDiscounts({});
      setGlobalDiscountPercent(0);
      toast.success("Última venda carregada no carrinho");
    },

    // Sync
    ...sync,
  };
}
