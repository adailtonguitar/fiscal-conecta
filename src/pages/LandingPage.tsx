import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  BarChart3,
  Package,
  FileText,
  Wifi,
  WifiOff,
  Users,
  Shield,
  Zap,
  Check,
  ArrowRight,
  Smartphone,
  Monitor,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UpdateNoticeModal } from "@/components/UpdateNoticeModal";

const features = [
  { icon: ShoppingCart, title: "PDV Completo", desc: "Terminal de vendas com atalhos de teclado, leitor de código de barras e pagamentos múltiplos." },
  { icon: FileText, title: "Emissão Fiscal", desc: "NF-e, NFC-e e SAT integrados com a SEFAZ. Contingência automática e DANFE." },
  { icon: Package, title: "Controle de Estoque", desc: "Movimentações em tempo real, alertas de estoque baixo, importação por CSV e NF-e." },
  { icon: BarChart3, title: "Gestão Financeira", desc: "Contas a pagar e receber, fluxo de caixa, fechamento diário e relatórios de lucratividade." },
  { icon: WifiOff, title: "Funciona Offline", desc: "Continue vendendo sem internet. Sincronização automática quando a conexão voltar." },
  { icon: Shield, title: "Multi-tenant Seguro", desc: "Isolamento total entre empresas, permissões por perfil e trilha de auditoria completa." },
];

const plans = [
  {
    name: "Essencial",
    price: "150",
    desc: "Para pequenos comércios",
    features: ["1 terminal PDV", "100 produtos", "NFC-e ilimitada", "Suporte por e-mail"],
    highlighted: false,
    planKey: PLANS.essencial.key,
  },
  {
    name: "Profissional",
    price: "200",
    desc: "Para negócios em crescimento",
    features: ["3 terminais PDV", "Produtos ilimitados", "NF-e + NFC-e", "Relatórios avançados", "Suporte prioritário"],
    highlighted: true,
    planKey: PLANS.profissional.key,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    desc: "Para redes e franquias",
    features: ["Terminais ilimitados", "Multi-empresa", "API dedicada", "White label", "Gerente de conta"],
    highlighted: false,
    planKey: null,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!plan.planKey) return; // Enterprise = contact sales
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
    <div className="min-h-screen bg-background text-foreground">
      <UpdateNoticeModal />
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="text-xl font-extrabold tracking-tight text-primary">
            PDV<span className="text-foreground">Fiscal</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
            <Button asChild size="sm">
              <Link to="/auth">Começar grátis</Link>
            </Button>
          </div>
          <Button asChild size="sm" className="md:hidden">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Gestão comercial completa na nuvem
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
              Seu comércio no controle.{" "}
              <span className="text-primary">Online e offline.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              PDV fiscal, estoque, financeiro e emissão de notas em uma única plataforma.
              Funciona mesmo sem internet. Pronto para vender em minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button asChild size="lg" className="text-base px-8 h-12">
                <Link to="/auth">
                  Começar grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
                <a href="#features">Ver recursos</a>
              </Button>
            </div>
          </motion.div>

          {/* Device mockup hint */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-16 flex justify-center gap-6 text-muted-foreground"
          >
            {[
              { icon: Monitor, label: "Desktop" },
              { icon: Smartphone, label: "Mobile" },
              { icon: Cloud, label: "Nuvem" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Tudo que você precisa para vender</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Do primeiro cadastro à emissão fiscal, cada módulo foi pensado para simplificar sua operação.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="rounded-2xl bg-card border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Planos que cabem no seu negócio</h2>
            <p className="mt-3 text-muted-foreground">Comece grátis por 14 dias. Sem cartão de crédito.</p>
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
                  <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Mais popular</span>
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

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pronto para modernizar seu negócio?</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Cadastre-se em segundos e comece a vender hoje mesmo. 14 dias grátis, sem compromisso.
          </p>
          <Button asChild size="lg" className="mt-8 text-base px-10 h-12">
            <Link to="/auth">
              Criar conta grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PDVFiscal. Todos os direitos reservados.
          </span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link to="/install" className="hover:text-foreground transition-colors">Instalar App</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
