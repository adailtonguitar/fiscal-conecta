import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <span className="text-xl font-extrabold tracking-tight text-primary">
          Antho<span className="text-foreground">System</span>
        </span>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#vantagens" className="hover:text-foreground transition-colors">Vantagens</a>
          <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
          <Button asChild size="sm">
            <Link to="/auth">Teste grátis</Link>
          </Button>
        </div>
        <Button asChild size="sm" className="md:hidden">
          <Link to="/auth">Entrar</Link>
        </Button>
      </div>
    </nav>
  );
}
