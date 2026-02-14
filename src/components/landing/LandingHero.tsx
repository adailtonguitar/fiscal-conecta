import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ScanBarcode, Scale, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <ScanBarcode className="w-4 h-4" />
            Sistema completo para supermercados
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            Seu supermercado no{" "}
            <span className="text-primary">controle total.</span>
            <br className="hidden sm:block" />
            <span className="text-3xl sm:text-4xl lg:text-5xl text-muted-foreground font-bold">
              Online e offline.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            PDV com balança e leitor de código de barras, emissão de NFC-e/NF-e,
            controle de estoque com validade e lotes, financeiro completo.
            <strong className="text-foreground"> Funciona mesmo sem internet.</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link to="/auth">
                Começar grátis por 8 dias
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-12">
              <a href="#recursos">Ver recursos</a>
            </Button>
          </div>
        </motion.div>

        {/* Stat badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-6"
        >
          {[
            { icon: ScanBarcode, label: "Leitor de código", sub: "EAN-13, QR Code" },
            { icon: Scale, label: "Balança integrada", sub: "Peso e preço/kg" },
            { icon: Receipt, label: "NFC-e automática", sub: "Emissão na SEFAZ" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold block">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
