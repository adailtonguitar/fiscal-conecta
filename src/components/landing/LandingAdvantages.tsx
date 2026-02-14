import { motion } from "framer-motion";
import { TrendingDown, Clock, Smartphone, Headphones } from "lucide-react";

const advantages = [
  {
    icon: TrendingDown,
    title: "Reduza perdas em até 30%",
    desc: "Controle de validade e lotes evita que produtos vençam na prateleira sem que você perceba.",
  },
  {
    icon: Clock,
    title: "Caixa 2x mais rápido",
    desc: "PDV otimizado para supermercados com atalhos, leitor e pesagem. Menos fila, mais vendas.",
  },
  {
    icon: Smartphone,
    title: "Acesse de qualquer lugar",
    desc: "Acompanhe vendas, estoque e financeiro pelo celular ou computador em tempo real.",
  },
  {
    icon: Headphones,
    title: "Suporte especializado",
    desc: "Equipe que entende a rotina de supermercado. Atendimento rápido por WhatsApp.",
  },
];

export function LandingAdvantages() {
  return (
    <section id="vantagens" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Por que supermercados escolhem o AnthoSystem?
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <a.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{a.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
