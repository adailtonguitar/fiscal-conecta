import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface UpgradeBannerProps {
  feature?: string;
  className?: string;
  inline?: boolean;
}

export function UpgradeBanner({ feature, className = "", inline = false }: UpgradeBannerProps) {
  const navigate = useNavigate();

  if (inline) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 ${className}`}>
        <Crown className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-xs text-warning font-medium">
          {feature ? `${feature} — ` : ""}Disponível no plano Profissional
        </span>
        <button
          onClick={() => navigate("/trial-expirado")}
          className="ml-auto text-xs font-semibold text-primary hover:underline"
        >
          Upgrade
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
        <Crown className="w-8 h-8 text-warning" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {feature || "Recurso"} — Plano Profissional
      </h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
        Este recurso está disponível no plano Profissional. Faça o upgrade para desbloquear todas as funcionalidades.
      </p>
      <button
        onClick={() => navigate("/trial-expirado")}
        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
      >
        Ver planos e fazer upgrade
      </button>
    </motion.div>
  );
}
