/**
 * usePDV — self-contained PDV state management hook.
 * Consumes services and sync queue, fully offline-first.
 */
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useSync } from "@/hooks/useSync";
import { SaleService, CashSessionService } from "@/services";
import { cacheEntities, getCachedEntities } from "@/lib/sync-queue";
import { supabase } from "@/integrations/supabase/client";
import type { SaleItem, PaymentResult } from "@/services/types";
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
}

export interface PDVCartItem extends PDVProduct {
  quantity: number;
}

export function usePDV() {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const sync = useSync();

  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [cartItems, setCartItems] = useState<PDVCartItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Load products from DB or cache
  useEffect(() => {
    if (!companyId) return;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("products")
            .select("id, name, price, category, sku, ncm, unit, stock_quantity, barcode")
            .eq("company_id", companyId)
            .eq("is_active", true)
            .order("name");

          if (!error && data) {
            setProducts(data as PDVProduct[]);
            await cacheEntities("products", data);
          }
        } else {
          const cached = await getCachedEntities<PDVProduct>("products");
          setProducts(cached);
        }
      } catch {
        const cached = await getCachedEntities<PDVProduct>("products");
        setProducts(cached);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, [companyId, sync.isOnline]);

  // Load current cash session
  useEffect(() => {
    if (!companyId) return;

    const loadSession = async () => {
      setLoadingSession(true);
      try {
        if (navigator.onLine) {
          const session = await CashSessionService.getCurrentSession(companyId);
          setCurrentSession(session);
        }
      } catch {
        // offline — no session data
      } finally {
        setLoadingSession(false);
      }
    };

    loadSession();
  }, [companyId]);

  // Cart operations
  const addToCart = useCallback((product: PDVProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
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

  const clearCart = useCallback(() => setCartItems([]), []);

  // Finalize sale
  const finalizeSale = useCallback(async (paymentResults: PaymentResult[]) => {
    if (!companyId || !user || cartItems.length === 0) {
      throw new Error("Dados incompletos para finalizar venda");
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
        const result = await SaleService.finalizeSale({
          companyId,
          userId: user.id,
          sessionId: currentSession?.id,
          items,
          total,
          paymentMethod: paymentMethodLabel,
          paymentResults,
        });

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
  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(
      (p) => p.sku === barcode || p.barcode === barcode || p.id === barcode
    );
    if (product) {
      addToCart(product);
      toast.success(`${product.name} adicionado`);
    } else {
      toast.error(`Produto não encontrado: ${barcode}`);
    }
  }, [products, addToCart]);

  return {
    // Products
    products,
    loadingProducts,

    // Cart
    cartItems,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,

    // Sale
    finalizeSale,

    // Session
    currentSession,
    loadingSession,

    // Barcode
    handleBarcodeScan,

    // Sync
    ...sync,
  };
}
