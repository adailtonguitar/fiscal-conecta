import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

declare const __APP_VERSION__: string;

const STORAGE_KEY = "update-notice-version-dismissed";
const APP_VERSION = __APP_VERSION__;

export function UpdateNoticeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Skip update modal inside Electron — the app always loads the latest published URL
    if ((window as any).electronAPI?.isElectron) return;

    const dismissedVersion = localStorage.getItem(STORAGE_KEY);
    // Only show if user hasn't dismissed this specific version
    if (dismissedVersion !== APP_VERSION) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setOpen(false);
  };

  const handleUpdate = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    // Fire-and-forget: clean up in background, reload immediately
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs =>
        regs.forEach(r => r.unregister())
      ).catch(() => {});
    }
    if ("caches" in window) {
      caches.keys().then(keys =>
        keys.forEach(k => caches.delete(k))
      ).catch(() => {});
    }
    // Reload immediately without waiting for cleanup
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 2147483647 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-primary/40 bg-card p-6 shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Zap className="h-7 w-7 text-primary" />
        </div>

        <h2 className="text-center text-xl font-bold tracking-tight text-foreground">
          Atualização disponível
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
          Uma nova versão do sistema está disponível. Clique em atualizar para aplicar todas as melhorias de uma vez.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleUpdate} className="w-full">
            Atualizar agora
          </Button>
          <Button variant="ghost" onClick={handleClose} className="w-full text-muted-foreground">
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}
