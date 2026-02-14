import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCTA() {
  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Pronto para modernizar seu supermercado?</h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Cadastre-se em segundos e comece a vender hoje mesmo. 8 dias grátis, sem compromisso.
        </p>
        <Button asChild size="lg" className="mt-8 text-base px-10 h-12">
          <Link to="/auth">
            Criar conta grátis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
