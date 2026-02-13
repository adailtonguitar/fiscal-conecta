import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TRIAL_DAYS = 8;
const GRACE_PERIOD_DAYS = 3; // Days after subscription expires before blocking

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
  // Inadimplência states
  wasSubscriber: boolean; // Had a subscription before
  subscriptionOverdue: boolean; // Subscription expired (past grace period)
  gracePeriodActive: boolean; // In grace period after expiration
  graceDaysLeft: number | null;
  daysUntilExpiry: number | null; // Days until current subscription expires
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
  wasSubscriber: false,
  subscriptionOverdue: false,
  gracePeriodActive: false,
  graceDaysLeft: null,
  daysUntilExpiry: null,
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

function calcGracePeriod(subscriptionEnd: string) {
  const endDate = new Date(subscriptionEnd).getTime();
  const now = Date.now();
  const graceEndMs = endDate + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const remainMs = graceEndMs - now;
  const graceDaysLeft = Math.max(0, Math.ceil(remainMs / (24 * 60 * 60 * 1000)));
  const isInGrace = now > endDate && graceDaysLeft > 0;
  const isOverdue = graceDaysLeft <= 0 && now > endDate;
  return { gracePeriodActive: isInGrace, graceDaysLeft: isInGrace ? graceDaysLeft : null, subscriptionOverdue: isOverdue };
}

function calcDaysUntilExpiry(subscriptionEnd: string): number | null {
  const endDate = new Date(subscriptionEnd).getTime();
  const now = Date.now();
  if (now > endDate) return null;
  return Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
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
      const subscriptionEnd = data?.subscription_end ?? null;
      const wasSubscriber = data?.was_subscriber ?? false;
      const lastSubscriptionEnd = data?.last_subscription_end ?? null;

      if (isSubscribed && subscriptionEnd) {
        // Active subscription
        const daysUntilExpiry = calcDaysUntilExpiry(subscriptionEnd);
        setState({
          subscribed: true,
          planKey,
          subscriptionEnd,
          loading: false,
          trialActive: false,
          trialDaysLeft: null,
          trialExpired: false,
          wasSubscriber: true,
          subscriptionOverdue: false,
          gracePeriodActive: false,
          graceDaysLeft: null,
          daysUntilExpiry,
        });
      } else if (wasSubscriber && lastSubscriptionEnd) {
        // Was a subscriber but subscription expired — check grace period
        const grace = calcGracePeriod(lastSubscriptionEnd);
        setState({
          subscribed: false,
          planKey,
          subscriptionEnd: lastSubscriptionEnd,
          loading: false,
          trialActive: false,
          trialDaysLeft: null,
          trialExpired: false,
          wasSubscriber: true,
          ...grace,
          daysUntilExpiry: null,
        });
      } else {
        // Never subscribed — use trial
        const trial = calcTrial(createdAt);
        setState({
          subscribed: false,
          planKey: null,
          subscriptionEnd: null,
          loading: false,
          ...trial,
          wasSubscriber: false,
          subscriptionOverdue: false,
          gracePeriodActive: false,
          graceDaysLeft: null,
          daysUntilExpiry: null,
        });
      }
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
