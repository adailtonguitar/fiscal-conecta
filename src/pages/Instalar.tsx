import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Wifi, WifiOff, Share, MoreVertical, Plus, ArrowRight } from "lucide-react";
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
    <div className="h-screen bg-background overflow-y-auto">
      <div className="max-w-lg w-full mx-auto space-y-6 p-4 pb-12">
        <div className="text-center space-y-2">
          <img src="/pwa-icon-192.png" alt="AnthoSystem" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold text-foreground">AnthoSystem</h1>
          <p className="text-muted-foreground">Sistema de vendas com operação offline</p>
        </div>

        {isInstalled ? (
          <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle className="h-12 w-12" />
                <p className="text-lg font-semibold">App já instalado!</p>
                <p className="text-sm text-muted-foreground text-center">
                  O AnthoSystem já está instalado no seu dispositivo. Procure o ícone na sua tela inicial.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Instalação rápida
              </CardTitle>
              <CardDescription>Clique no botão abaixo para instalar em segundos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstall} size="lg" className="w-full text-base">
                <Download className="mr-2 h-5 w-5" />
                Instalar agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Como instalar
              </CardTitle>
              <CardDescription>Siga os passos para o seu dispositivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* iPhone / iPad */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">iPhone / iPad</p>
                    <p className="text-xs text-muted-foreground">Abra no Safari</p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Toque no ícone <Share className="inline h-4 w-4 text-primary mx-0.5 -mt-0.5" /> <strong className="text-foreground">Compartilhar</strong> na barra inferior</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Role e toque em <Plus className="inline h-4 w-4 text-primary mx-0.5 -mt-0.5" /> <strong className="text-foreground">Adicionar à Tela de Início</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Toque em <strong className="text-foreground">Adicionar</strong> no canto superior direito</span>
                  </li>
                </ol>
              </div>

              {/* Android */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Android</p>
                    <p className="text-xs text-muted-foreground">Abra no Chrome</p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Toque no menu <MoreVertical className="inline h-4 w-4 text-primary mx-0.5 -mt-0.5" /> no canto superior direito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Toque em <strong className="text-foreground">Instalar aplicativo</strong> ou <strong className="text-foreground">Adicionar à tela inicial</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Confirme tocando em <strong className="text-foreground">Instalar</strong></span>
                  </li>
                </ol>
              </div>

              {/* Desktop PWA */}
              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Versão Web (Leve)</p>
                    <p className="text-xs text-muted-foreground">Instalação rápida pelo navegador, sem download pesado</p>
                  </div>
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Abra no <strong className="text-foreground">Chrome, Edge ou Brave</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Clique no ícone <Download className="inline h-4 w-4 text-primary mx-0.5 -mt-0.5" /> na <strong className="text-foreground">barra de endereço</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Clique em <strong className="text-foreground">Instalar</strong></span>
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">✨ Sem download</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">⚡ Instalação instantânea</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full">🔄 Sempre atualizado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Windows Installer Download */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Versão Desktop (Completa)
            </CardTitle>
            <CardDescription>Aplicativo nativo para Windows com ícone na área de trabalho</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              size="lg"
              className="w-full text-base"
            >
              <a
                href="https://github.com/adailtonguitar/fiscal-conecta/releases/latest/download/AnthoSystem.Setup.0.0.0.exe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-5 w-5" />
                Baixar para Windows (.exe)
              </a>
            </Button>
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              <span className="text-xs bg-muted px-2 py-1 rounded-full">🖥️ App nativo</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">🔄 Atualização automática</span>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">📌 Ícone na área de trabalho</span>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Compatível com Windows 10 e 11
            </p>
          </CardContent>
        </Card>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${isOnline ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>
          {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {isOnline ? "Conectado — dados sincronizados" : "Offline — operando localmente"}
          </span>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-1">
            Ir para o sistema <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}