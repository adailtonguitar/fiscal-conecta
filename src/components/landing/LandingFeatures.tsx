import { motion } from "framer-motion";
import {
  ShoppingCart,
  BarChart3,
  Package,
  FileText,
  WifiOff,
  Shield,
  Scale,
  CalendarClock,
  Users,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  {
    icon: ShoppingCart,
    title: "PDV para Supermercado",
    desc: "Caixa rápido com atalhos de teclado, leitor de código de barras, pesagem integrada e múltiplas formas de pagamento.",
  },
  {
    icon: FileText,
    title: "Emissão Fiscal NFC-e / NF-e",
    desc: "Emissão automática de cupom fiscal integrado à SEFAZ. Contingência offline e DANFE inclusos.",
  },
  {
    icon: Package,
    title: "Estoque com Validade e Lotes",
    desc: "Controle de lotes, datas de validade, alerta de produtos vencendo, importação por NF-e e CSV.",
  },
  {
    icon: Scale,
    title: "Balança e Produtos por Peso",
    desc: "Integração com balanças, leitura de etiquetas de peso, preço por kg/g com cálculo automático.",
  },
  {
    icon: BarChart3,
    title: "Financeiro Completo",
    desc: "Contas a pagar/receber, fluxo de caixa, DRE, fechamento diário e relatórios de lucratividade.",
  },
  {
    icon: WifiOff,
    title: "Funciona Sem Internet",
    desc: "Continue vendendo e emitindo mesmo offline. Tudo sincroniza automaticamente quando a conexão voltar.",
  },
  {
    icon: CalendarClock,
    title: "Controle de Perdas e Validade",
    desc: "Registre perdas, quebras e avarias. Alertas automáticos de produtos próximos ao vencimento.",
  },
  {
    icon: Users,
    title: "Multi-caixa e Permissões",
    desc: "Vários terminais simultâneos, perfis de acesso (caixa, gerente, dono) e trilha de auditoria.",
  },
  {
    icon: Shield,
    title: "Segurança e Backup",
    desc: "Dados criptografados na nuvem, backup automático diário e isolamento total entre filiais.",
  },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="py-24 bg-card/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">
            Tudo que seu supermercado precisa em um só sistema
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Do caixa à gestão financeira, cada módulo foi pensado para a realidade do varejo alimentar.
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
  );
}
