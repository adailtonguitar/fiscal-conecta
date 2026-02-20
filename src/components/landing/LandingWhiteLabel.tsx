import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Palette, Users, BarChart3, BadgePercent, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Palette,
    title: "Sua marca, seu sistema",
    desc: "Logo, cores e nome personalizado. Seu cliente nunca saberá que é AnthoSystem por trás.",
  },
  {
    icon: BadgePercent,
    title: "Margem sobre cada venda",
    desc: "Defina seus preços e planos. Você lucra em cada licença ativa.",
  },
  {
    icon: Users,
    title: "Painel de gestão",
    desc: "Gerencie licenças, clientes e comissões em um painel exclusivo.",
  },
  {
    icon: BarChart3,
    title: "Escale sem desenvolver",
    desc: "Ofereça um sistema completo sem precisar programar nada.",
  },
];

export function LandingWhiteLabel() {
  return (
    <section id="revenda" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Programa de Revenda
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Revenda com a{" "}
              <span className="text-primary">sua marca</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Seja um revendedor white-label. Ofereça um sistema completo para supermercados
              com sua identidade visual e seus preços.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button asChild size="lg" className="text-base px-8 h-12 font-semibold shadow-lg shadow-primary/20">
                <Link to="/auth">
                  Quero ser revendedor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right — cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
