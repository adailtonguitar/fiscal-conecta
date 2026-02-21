import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const plans = [
  {
    name: "Essencial",
    price: "149,90",
    desc: "Para minimercados e mercearias",
    icon: Zap,
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
    icon: Star,
    features: [
      "Até 5 terminais PDV",
      "Produtos ilimitados",
      "NF-e + NFC-e ilimitadas",
      "Controle de lotes e validade",
      "Relatórios com IA",
      "Multi-usuários e permissões",
      "Programa de fidelidade",
      "Curva ABC e painel de lucro",
      "Suporte prioritário WhatsApp",
    ],
    highlighted: true,
    planKey: PLANS.profissional.key,
  },
  {
    name: "Rede",
    price: "Sob consulta",
    desc: "Para redes e franquias",
    icon: Star,
    features: [
      "Terminais ilimitados",
      "Multi-loja centralizada",
      "API dedicada",
      "Personalização avançada",
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
    if (!plan.planKey) {
      window.open("https://wa.me/5500000000000?text=Olá! Tenho interesse no plano Rede do AnthoSystem.", "_blank");
      return;
    }
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
    <section id="planos" className="py-24 bg-card/40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Planos</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Planos que cabem no seu supermercado
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Teste grátis por 8 dias. Sem cartão de crédito.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-gradient-to-b from-primary/5 to-card shadow-xl shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                  : "border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-md">
                    Mais popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>

              <div className="mt-6 mb-6">
                {plan.price === "Sob consulta" ? (
                  <span className="text-2xl font-bold">Sob consulta</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground font-medium">R$</span>
                    <span className="text-4xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-7 w-full h-11 font-semibold"
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

        {/* Formas de pagamento */}
        <div className="mt-16">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Formas de pagamento aceitas
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Pix", icon: "💠", sub: "5% de desconto", color: "border-primary bg-primary/15 text-primary ring-2 ring-primary/30 shadow-lg shadow-primary/15" },
              { label: "Crédito", icon: "💳", sub: "Até 12x", color: "border-blue-500/50 bg-blue-500/15 text-blue-600 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10" },
              { label: "Débito", icon: "💳", sub: "À vista", color: "border-amber-500/50 bg-amber-500/15 text-amber-600 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10" },
              { label: "Boleto", icon: "🧾", sub: "Venc. 3 dias", color: "border-violet-500/50 bg-violet-500/15 text-violet-600 ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10" },
            ].map((m) => (
              <div
                key={m.label}
                className={`flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border font-medium ${m.color}`}
              >
                <span className="text-3xl">{m.icon}</span>
                <span className="text-base font-bold">{m.label}</span>
                <span className="text-[11px] font-semibold opacity-80">{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
