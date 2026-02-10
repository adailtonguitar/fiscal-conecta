import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useReseller } from "@/hooks/useReseller";
import { useIsReseller } from "@/hooks/useIsReseller";
import { ResellerSetup } from "@/components/reseller/ResellerSetup";
import { ResellerDashboard } from "@/components/reseller/ResellerDashboard";
import { ResellerPlans } from "@/components/reseller/ResellerPlans";
import { ResellerLicenses } from "@/components/reseller/ResellerLicenses";
import { ResellerBranding } from "@/components/reseller/ResellerBranding";
import { LayoutDashboard, CreditCard, Palette, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "plans", label: "Planos", icon: CreditCard },
  { id: "licenses", label: "Licenças", icon: KeyRound },
  { id: "branding", label: "Marca", icon: Palette },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function Revendas() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const { isReseller, loading: resellerCheckLoading } = useIsReseller();
  const {
    reseller,
    plans,
    licenses,
    commissions,
    loading,
    createReseller,
    updateReseller,
    createPlan,
    updatePlan,
    deletePlan,
    createLicense,
    updateLicense,
  } = useReseller();

  if (loading || resellerCheckLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isReseller && !reseller) {
    return <Navigate to="/" replace />;
  }

  if (!reseller) {
    return (
      <div className="p-6">
        <ResellerSetup onCreate={createReseller} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel da Revenda</h1>
        <p className="text-sm text-muted-foreground mt-1">{reseller.brand_name} — {reseller.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <ResellerDashboard plans={plans} licenses={licenses} commissions={commissions} />
      )}
      {activeTab === "plans" && (
        <ResellerPlans
          plans={plans}
          markupPercentage={reseller.markup_percentage}
          onCreatePlan={createPlan}
          onUpdatePlan={updatePlan}
          onDeletePlan={deletePlan}
        />
      )}
      {activeTab === "licenses" && (
        <ResellerLicenses
          licenses={licenses}
          plans={plans}
          onCreateLicense={createLicense}
          onUpdateLicense={updateLicense}
        />
      )}
      {activeTab === "branding" && (
        <ResellerBranding reseller={reseller} onUpdate={updateReseller} />
      )}
    </div>
  );
}
