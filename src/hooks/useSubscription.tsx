import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Stripe product/price mapping
export const PLANS = {
  essencial: {
    product_id: "prod_TxH3ZeNDCtALce",
    price_id: "price_1SzMVh5ZkhRjWpdwabX6OoEF",
    name: "Essencial",
    price: 150,
  },
  profissional: {
    product_id: "prod_TxH3SQG86jZyc7",
    price_id: "price_1SzMVs5ZkhRjWpdwAPrV29FW",
    name: "Profissional",
    price: 200,
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  planKey: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  loading: true,
  planKey: null,
  checkSubscription: async () => {},
  createCheckout: async () => {},
  openCustomerPortal: async () => {},
});

function getPlanKey(productId: string | null): string | null {
  if (!productId) return null;
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId) return key;
  }
  return null;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    loading: true,
    planKey: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, productId: null, subscriptionEnd: null, loading: false, planKey: null });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      const productId = data?.product_id ?? null;
      setState({
        subscribed: data?.subscribed ?? false,
        productId,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
        planKey: getPlanKey(productId),
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = useCallback(async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  const openCustomerPortal = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, createCheckout, openCustomerPortal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
