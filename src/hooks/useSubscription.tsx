import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TRIAL_DAYS = 8;

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
  trialActive: boolean;
  trialDaysLeft: number | null;
  trialExpired: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  loading: true,
  planKey: null,
  trialActive: false,
  trialDaysLeft: null,
  trialExpired: false,
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  ...defaultState,
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

function calcTrial(createdAt: string) {
  const start = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsed = now - start;
  const totalMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const remainMs = totalMs - elapsed;
  const daysLeft = Math.max(0, Math.ceil(remainMs / (24 * 60 * 60 * 1000)));
  return { trialActive: daysLeft > 0, trialDaysLeft: daysLeft, trialExpired: daysLeft <= 0 };
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>(defaultState);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ ...defaultState, loading: false });
      return;
    }
    try {
      // Fetch subscription status and user creation date in parallel
      const [subResult, profileResult] = await Promise.all([
        supabase.functions.invoke("check-subscription"),
        supabase.from("company_users").select("created_at").eq("user_id", user.id).eq("is_active", true).limit(1).single(),
      ]);

      if (subResult.error) throw subResult.error;

      const productId = subResult.data?.product_id ?? null;
      const isSubscribed = subResult.data?.subscribed ?? false;

      // Calculate trial based on company_users.created_at
      const createdAt = profileResult.data?.created_at ?? user.created_at;
      const trial = isSubscribed
        ? { trialActive: false, trialDaysLeft: null, trialExpired: false }
        : calcTrial(createdAt);

      setState({
        subscribed: isSubscribed,
        productId,
        subscriptionEnd: subResult.data?.subscription_end ?? null,
        loading: false,
        planKey: getPlanKey(productId),
        ...trial,
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
