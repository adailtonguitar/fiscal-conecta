import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Palette, Users, BarChart3, BadgePercent, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Palette,
    title: "Sua marca, seu sistema",
    desc: "Personalize logo, cores e nome. Seu cliente nunca saberá que é AnthoSystem por trás.",
  },
  {
    icon: BadgePercent,
    title: "Margem sobre cada venda",
    desc: "Defina seus próprios preços e planos. Você lucra em cada licença ativa.",
  },
  {
    icon: Users,
    title: "Painel de gestão completo",
    desc: "Gerencie licenças, clientes e comissões em um painel exclusivo para revendedores.",
  },
  {
    icon: BarChart3,
    title: "Escale sem desenvolver",
    desc: "Ofereça um sistema completo de PDV, estoque e fiscal sem precisar programar nada.",
  },
];

export function LandingWhiteLabel() {
  return (
    <section id="revenda" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left – text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Palette className="w-4 h-4" />
              Programa de Revenda
            </span>
            <h2 className="text-3xl font-bold tracking-tight">
              Revenda o AnthoSystem com a <span className="text-primary">sua marca</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Seja um revendedor white-label. Ofereça um sistema completo para supermercados
              aos seus clientes, com sua identidade visual e seus preços — sem precisar desenvolver nada.
            </p>
            <Button asChild size="lg" className="mt-8 text-base px-8 h-12">
              <Link to="/auth">
                Quero ser revendedor
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Right – benefit cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
