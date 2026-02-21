import { motion } from "framer-motion";
import { Crown, Check, ArrowRight, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const plans = [
  {
    key: "essencial",
    name: "Essencial",
    price: "149,90",
    desc: "Para pequenos comércios",
    features: [
      "1 terminal PDV",
      "Até 500 produtos",
      "Até 200 notas/mês",
      "Controle de estoque",
      "Financeiro básico",
      "Relatórios de vendas",
      "Suporte por e-mail",
    ],
  },
  {
    key: "profissional",
    name: "Profissional",
    price: "199,90",
    desc: "Para negócios em crescimento",
    features: [
      "Até 5 terminais PDV",
      "Produtos ilimitados",
      "NF-e + NFC-e",
      "Relatórios avançados com IA",
      "Programa de fidelidade",
      "Multi-usuários e permissões",
      "Orçamentos e cotações",
      "Curva ABC e painel de lucro",
      "Suporte prioritário",
    ],
  },
];

export default function Renovar() {
  const { user } = useAuth();
  const { subscribed, planKey, daysUntilExpiry, createCheckout, loading: subLoading } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!user) return <Navigate to="/auth" replace />;

  const currentPlan = planKey || "essencial";
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  const handleCheckout = async (selectedPlan: string) => {
    try {
      setLoadingPlan(selectedPlan);
      await createCheckout(selectedPlan);
    } catch {
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AnthoSystem</h1>
              <p className="text-xs text-muted-foreground">Gestão de Assinatura</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard"}>
            Voltar ao sistema
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Current plan info */}
        {subscribed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className={`rounded-2xl border p-6 ${
              isExpiringSoon 
                ? "border-warning/40 bg-warning/5" 
                : "border-primary/30 bg-primary/5"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isExpiringSoon ? (
                      <Clock className="w-5 h-5 text-warning" />
                    ) : (
                      <Shield className="w-5 h-5 text-primary" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">Seu plano atual</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Plano {currentPlan === "profissional" ? "Profissional" : "Essencial"}
                  </h2>
                  {isExpiringSoon && daysUntilExpiry !== null && (
                    <p className="text-warning font-medium mt-1">
                      ⚠️ Vence em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? "s" : ""}
                    </p>
                  )}
                  {!isExpiringSoon && daysUntilExpiry !== null && (
                    <p className="text-muted-foreground text-sm mt-1">
                      Válido por mais {daysUntilExpiry} dias
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={() => handleCheckout(currentPlan)}
                  disabled={loadingPlan === currentPlan}
                  className="shrink-0"
                >
                  {loadingPlan === currentPlan ? "Redirecionando..." : "Renovar mesmo plano"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Plans section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-2">
            {subscribed ? "Ou escolha outro plano" : "Escolha seu plano"}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Pagamento seguro via Mercado Pago • PIX, cartão de crédito, boleto ou saldo MP
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan, i) => {
              const isCurrent = subscribed && plan.key === currentPlan;
              const isHighlighted = plan.key === "profissional";

              return (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                  className={`rounded-2xl border p-6 flex flex-col relative ${
                    isCurrent
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : isHighlighted
                      ? "border-primary/50 bg-card shadow-lg"
                      : "border-border bg-card"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      Plano atual
                    </span>
                  )}
                  {!isCurrent && isHighlighted && (
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                      Mais popular
                    </span>
                  )}

                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>

                  <div className="mt-5 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    variant={isCurrent ? "default" : isHighlighted ? "default" : "outline"}
                    disabled={loadingPlan === plan.key}
                    onClick={() => handleCheckout(plan.key)}
                  >
                    {loadingPlan === plan.key
                      ? "Redirecionando..."
                      : isCurrent
                      ? "Renovar este plano"
                      : plan.key === "profissional" && currentPlan === "essencial"
                      ? "Fazer upgrade"
                      : "Escolher este plano"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Voltar ao sistema
          </button>
        </div>
      </div>
    </div>
  );
}