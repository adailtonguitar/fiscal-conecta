import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const plans = [
  {
    name: "Essencial",
    price: "149,90",
    desc: "Para minimercados e mercearias",
    features: [
      "1 terminal PDV",
      "Até 500 produtos",
      "Até 200 NFC-e/mês",
      "Controle de estoque e validade",
      "Financeiro básico",
      "Relatórios de vendas",
      "Funciona offline",
      "Suporte por e-mail",
    ],
    highlighted: false,
    planKey: PLANS.essencial.key,
  },
  {
    name: "Profissional",
    price: "199,90",
    desc: "Para supermercados em crescimento",
    features: [
      "Até 5 terminais PDV",
      "Produtos ilimitados",
      "NF-e + NFC-e ilimitadas",
      "Controle de lotes e validade",
      "Relatórios com IA",
      "Multi-usuários e permissões",
      "Programa de fidelidade",
      "Curva ABC e painel de lucro",
      "Suporte prioritário por WhatsApp",
    ],
    highlighted: true,
    planKey: PLANS.profissional.key,
  },
  {
    name: "Rede",
    price: "Sob consulta",
    desc: "Para redes e franquias",
    features: [
      "Terminais ilimitados",
      "Multi-loja centralizada",
      "API dedicada",
      "Personalização (white label)",
      "Gerente de conta exclusivo",
    ],
    highlighted: false,
    planKey: null,
  },
];

export function LandingPricing() {
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanClick = async (plan: (typeof plans)[0]) => {
    if (!plan.planKey) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      setLoadingPlan(plan.name);
      await createCheckout(plan.planKey);
    } catch {
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="planos" className="py-24 bg-card/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Planos que cabem no seu supermercado</h2>
          <p className="mt-3 text-muted-foreground">Teste grátis por 8 dias. Sem cartão de crédito.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Mais popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              <div className="mt-5 mb-6">
                {plan.price === "Sob consulta" ? (
                  <span className="text-2xl font-bold">Sob consulta</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                )}
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
                {loadingPlan === plan.name
                  ? "Redirecionando..."
                  : plan.price === "Sob consulta"
                    ? "Falar com vendas"
                    : "Começar grátis"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
