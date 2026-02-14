import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AnthoSystem. Todos os direitos reservados.
        </span>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          <Link to="/install" className="hover:text-foreground transition-colors">Instalar App</Link>
        </div>
      </div>
    </footer>
  );
}
