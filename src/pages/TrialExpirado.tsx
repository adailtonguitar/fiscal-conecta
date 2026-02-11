import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  {
    name: "Essencial",
    price: "150",
    desc: "Para pequenos comércios",
    features: ["1 terminal PDV", "100 produtos", "NFC-e ilimitada", "Suporte por e-mail"],
    highlighted: false,
    planKey: "essencial",
  },
  {
    name: "Profissional",
    price: "200",
    desc: "Para negócios em crescimento",
    features: ["3 terminais PDV", "Produtos ilimitados", "NF-e + NFC-e", "Relatórios avançados", "Suporte prioritário"],
    highlighted: true,
    planKey: "profissional",
  },
];

export default function TrialExpirado() {
  const { user, signOut } = useAuth();
  const { createCheckout } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar um plano.");
      return;
    }
    try {
      setLoadingPlan(plan.name);
      await createCheckout(plan.planKey);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err?.message || "Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Seu período de teste expirou
        </h1>
        <p className="text-muted-foreground text-lg">
          Seus 8 dias de teste gratuito terminaram. Escolha um plano para continuar usando o sistema.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.highlighted
                ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                : "border-border bg-card"
            }`}
          >
            {plan.highlighted && (
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Mais popular</span>
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
              variant={plan.highlighted ? "default" : "outline"}
              disabled={loadingPlan === plan.name}
              onClick={() => handlePlanClick(plan)}
            >
              {loadingPlan === plan.name ? "Redirecionando..." : "Assinar agora"}
            </Button>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground text-center">
        Pagamento seguro via Mercado Pago • PIX, cartão de crédito ou boleto
      </p>

      <div className="mt-4 text-center">
        <button
          onClick={signOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
