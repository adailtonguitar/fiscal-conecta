import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TRIAL_DAYS = 8;

// Mercado Pago plan mapping
export const PLANS = {
  essencial: {
    key: "essencial",
    name: "Essencial",
    price: 150,
  },
  profissional: {
    key: "profissional",
    name: "Profissional",
    price: 200,
  },
} as const;

interface SubscriptionState {
  subscribed: boolean;
  planKey: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  trialActive: boolean;
  trialDaysLeft: number | null;
  trialExpired: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  createCheckout: (planKey: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  subscribed: false,
  planKey: null,
  subscriptionEnd: null,
  loading: true,
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
    // Always fetch company_users for trial calc, even if MP call fails
    let createdAt = user.created_at;
    try {
      const cuResult = await supabase.from("company_users").select("created_at").eq("user_id", user.id).eq("is_active", true).limit(1).single();
      if (cuResult.data?.created_at) createdAt = cuResult.data.created_at;
    } catch { /* ignore */ }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const isSubscribed = data?.subscribed ?? false;
      const planKey = data?.plan_key ?? null;
      const trial = isSubscribed
        ? { trialActive: false, trialDaysLeft: null, trialExpired: false }
        : calcTrial(createdAt);

      setState({
        subscribed: isSubscribed,
        planKey,
        subscriptionEnd: data?.subscription_end ?? null,
        loading: false,
        ...trial,
      });
    } catch {
      const trial = calcTrial(createdAt);
      setState((s) => ({ ...s, loading: false, ...trial }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const createCheckout = useCallback(async (planKey: string) => {
    // Open window immediately to avoid popup blocker
    const newWindow = window.open("", "_blank");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planKey },
      });
      if (error) throw error;
      if (data?.url && newWindow) {
        newWindow.location.href = data.url;
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        newWindow?.close();
        throw new Error("URL de checkout não retornada");
      }
    } catch (err) {
      newWindow?.close();
      throw err;
    }
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
