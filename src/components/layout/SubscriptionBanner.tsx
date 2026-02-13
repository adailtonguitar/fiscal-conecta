import { AlertTriangle, Clock, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SubscriptionBanner() {
  const { subscribed, daysUntilExpiry, gracePeriodActive, graceDaysLeft, trialActive, trialDaysLeft } = useSubscription();
  const { isSuperAdmin, loading: adminLoading } = useAdminRole();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (adminLoading) return null;
  if (dismissed || isSuperAdmin) return null;

  // Show warning when subscription expires in 5 days or less
  if (subscribed && daysUntilExpiry !== null && daysUntilExpiry <= 5) {
    return (
      <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-warning shrink-0" />
          <span className="text-warning font-medium">
            Sua assinatura vence em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? "s" : ""}. Renove para evitar interrupção.
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Show grace period warning
  if (gracePeriodActive && graceDaysLeft !== null) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-destructive font-medium">
            Assinatura vencida! Restam {graceDaysLeft} dia{graceDaysLeft !== 1 ? "s" : ""} de carência.{" "}
            <button onClick={() => navigate("/trial-expirado")} className="underline font-bold">
              Renovar agora
            </button>
          </span>
        </div>
      </div>
    );
  }

  // Show trial warning when 3 days or less
  if (trialActive && trialDaysLeft !== null && trialDaysLeft <= 3) {
    return (
      <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-warning shrink-0" />
          <span className="text-warning font-medium">
            Seu teste gratuito expira em {trialDaysLeft} dia{trialDaysLeft !== 1 ? "s" : ""}.{" "}
            <button onClick={() => navigate("/trial-expirado")} className="underline font-bold">
              Assinar plano
            </button>
          </span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
