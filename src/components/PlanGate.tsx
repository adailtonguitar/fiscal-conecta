import { usePlanLimits, type PlanLimits } from "@/hooks/usePlanLimits";
import { UpgradeBanner } from "@/components/UpgradeBanner";

interface PlanGateProps {
  feature: keyof PlanLimits;
  featureName: string;
  children: React.ReactNode;
}

/**
 * Wraps a page/section and shows an UpgradeBanner if the current plan
 * doesn't include the required feature.
 */
export function PlanGate({ feature, featureName, children }: PlanGateProps) {
  const { canAccessFeature, loading } = usePlanLimits();

  if (loading) return <>{children}</>;

  if (!canAccessFeature(feature)) {
    return <UpgradeBanner feature={featureName} />;
  }

  return <>{children}</>;
}
