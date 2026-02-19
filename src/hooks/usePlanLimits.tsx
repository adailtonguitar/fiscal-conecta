import { useSubscription } from "@/hooks/useSubscription";
import { useAdminRole } from "@/hooks/useAdminRole";

export interface PlanLimits {
  maxTerminals: number;
  maxProducts: number;
  hasNfe: boolean;
  hasAiReports: boolean;
  hasLoyalty: boolean;
  hasMultiUsers: boolean;
  hasQuotes: boolean;
  hasAbcCurve: boolean;
  hasProfitPanel: boolean;
  hasDre: boolean;
  hasCashFlow: boolean;
  hasCostCenter: boolean;
  hasCommissions: boolean;
  hasBankReconciliation: boolean;
  hasFinancialAlerts: boolean;
}

const ESSENCIAL_LIMITS: PlanLimits = {
  maxTerminals: 1,
  maxProducts: 500,
  hasNfe: false,
  hasAiReports: false,
  hasLoyalty: false,
  hasMultiUsers: false,
  hasQuotes: false,
  hasAbcCurve: false,
  hasProfitPanel: false,
  hasDre: false,
  hasCashFlow: false,
  hasCostCenter: false,
  hasCommissions: false,
  hasBankReconciliation: false,
  hasFinancialAlerts: false,
};

const PROFISSIONAL_LIMITS: PlanLimits = {
  maxTerminals: 5,
  maxProducts: Infinity,
  hasNfe: true,
  hasAiReports: true,
  hasLoyalty: true,
  hasMultiUsers: true,
  hasQuotes: true,
  hasAbcCurve: true,
  hasProfitPanel: true,
  hasDre: true,
  hasCashFlow: true,
  hasCostCenter: true,
  hasCommissions: true,
  hasBankReconciliation: true,
  hasFinancialAlerts: true,
};

// During trial, give full access (Profissional)
const TRIAL_LIMITS = PROFISSIONAL_LIMITS;

export function usePlanLimits() {
  const { subscribed, planKey, trialActive, loading } = useSubscription();
  const { isSuperAdmin, loading: adminLoading } = useAdminRole();

  let limits: PlanLimits;

  if (loading || adminLoading) {
    // While loading, give full access to avoid flickering
    limits = PROFISSIONAL_LIMITS;
  } else if (isSuperAdmin) {
    // Super admin always gets full access
    limits = PROFISSIONAL_LIMITS;
  } else if (trialActive) {
    limits = TRIAL_LIMITS;
  } else if (subscribed) {
    limits = planKey === "profissional" ? PROFISSIONAL_LIMITS : ESSENCIAL_LIMITS;
  } else {
    // Not subscribed, not trial → minimal access
    limits = ESSENCIAL_LIMITS;
  }

  const isProfissional = isSuperAdmin || planKey === "profissional" || trialActive;

  const canAccessFeature = (feature: keyof PlanLimits): boolean => {
    const value = limits[feature];
    return typeof value === "boolean" ? value : true;
  };

  return { limits, isProfissional, canAccessFeature, loading };
}
