import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Instalar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <img src="/pwa-icon-192.png" alt="PDV Fiscal" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold text-foreground">PDV Fiscal</h1>
          <p className="text-muted-foreground">Sistema de vendas com operação offline</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Instalar Aplicativo
            </CardTitle>
            <CardDescription>
              Instale o PDV Fiscal no seu dispositivo para usar sem internet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">App já está instalado!</span>
              </div>
            ) : deferredPrompt ? (
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Instalar agora
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Para instalar, use o menu do seu navegador:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">iPhone / iPad</p>
                      <p className="text-xs text-muted-foreground">Safari → Compartilhar → Adicionar à Tela Inicial</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Android</p>
                      <p className="text-xs text-muted-foreground">Chrome → Menu (⋮) → Instalar aplicativo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Monitor className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Desktop</p>
                      <p className="text-xs text-muted-foreground">Chrome → Barra de endereço → Ícone de instalar</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`flex items-center gap-2 p-3 rounded-lg ${isOnline ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {isOnline ? "Conectado — dados sincronizados" : "Offline — operando localmente"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Ir para o sistema
          </Button>
        </div>
      </div>
    </div>
  );
}
