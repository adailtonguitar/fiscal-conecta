import { useState } from "react";
import { AlertTriangle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateNoticeModal() {
  const [open, setOpen] = useState(() => {
    const dismissed = sessionStorage.getItem("update-notice-dismissed");
    return dismissed !== "true";
  });

  if (!open) return null;

  const handleClose = () => {
    sessionStorage.setItem("update-notice-dismissed", "true");
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 2147483647 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-primary/40 bg-card p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Zap className="h-7 w-7 text-primary" />
        </div>

        {/* Content */}
        <h2 className="text-center text-xl font-bold tracking-tight text-foreground">
          Atualização disponível
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
          Uma nova versão do sistema está disponível com melhorias de desempenho e correções.
          Atualize quando puder para a melhor experiência.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-accent/50 border border-border p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nenhuma ação é necessária agora. Seus dados estão seguros e o sistema continua funcionando normalmente.
          </p>
        </div>

        {/* Button */}
        <Button onClick={handleClose} className="mt-6 w-full">
          Entendi
        </Button>
      </div>
    </div>
  );
}
