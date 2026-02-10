import { useState, useCallback, useEffect } from "react";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVCart } from "@/components/pdv/PDVCart";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { usePDV } from "@/hooks/usePDV";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence, motion } from "framer-motion";
import { DollarSign, Wifi, WifiOff, RefreshCw, AlertTriangle, Keyboard, ArrowLeft, Maximize, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentResult } from "@/services/types";

const methodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão Débito",
  credito: "Cartão Crédito",
  pix: "PIX",
  voucher: "Voucher",
  outros: "Outros",
};

export default function PDV() {
  const pdv = usePDV();
  const navigate = useNavigate();
  const [showTEF, setShowTEF] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: typeof pdv.cartItems;
    total: number;
    payments: TEFResult[];
    nfceNumber: string;
  } | null>(null);

  const [showShortcuts, setShowShortcuts] = useState(false);

  useBarcodeScanner(pdv.handleBarcodeScan);

  const handleCheckout = useCallback(() => {
    if (pdv.cartItems.length > 0) setShowTEF(true);
  }, [pdv.cartItems.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Ignore when overlays are open
      if (showTEF || receipt || showCashRegister) {
        // ESC to close overlays
        if (e.key === "Escape") {
          e.preventDefault();
          if (receipt) setReceipt(null);
          else if (showCashRegister) setShowCashRegister(false);
        }
        return;
      }

      switch (e.key) {
        case "F2": // Finalizar venda
          e.preventDefault();
          handleCheckout();
          break;
        case "F3": // Focar busca de produtos
          e.preventDefault();
          const searchInput = document.querySelector<HTMLInputElement>('[data-pdv-search]');
          searchInput?.focus();
          break;
        case "F4": // Abrir caixa
          e.preventDefault();
          setShowCashRegister(true);
          break;
        case "F6": // Limpar carrinho
          e.preventDefault();
          if (pdv.cartItems.length > 0) {
            pdv.clearCart();
            toast.info("Carrinho limpo");
          }
          break;
        case "F9": // Sincronizar
          e.preventDefault();
          if (pdv.pendingCount > 0 && pdv.isOnline) {
            pdv.syncAll();
          }
          break;
        case "F1": // Ajuda de atalhos
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
          break;
        case "Escape":
          e.preventDefault();
          setShowShortcuts(false);
          break;
        case "Delete": // Remover último item
          e.preventDefault();
          if (pdv.cartItems.length > 0) {
            const lastItem = pdv.cartItems[pdv.cartItems.length - 1];
            pdv.removeItem(lastItem.id);
            toast.info(`${lastItem.name} removido`);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showTEF, receipt, showCashRegister, handleCheckout, pdv]);

  const handleTEFComplete = async (tefResults: TEFResult[]) => {
    const allApproved = tefResults.every((r) => r.approved);
    if (allApproved) {
      try {
        const paymentResults: PaymentResult[] = tefResults.map((r) => ({
          method: r.method,
          approved: r.approved,
          amount: r.amount,
          nsu: r.nsu,
          auth_code: r.authCode,
          card_brand: r.cardBrand,
          card_last_digits: r.cardLastDigits,
          installments: r.installments,
          change_amount: r.changeAmount,
          pix_tx_id: r.pixTxId,
        }));

        const savedItems = [...pdv.cartItems];
        const savedTotal = pdv.total;

        const result = await pdv.finalizeSale(paymentResults);

        setReceipt({
          items: savedItems,
          total: savedTotal,
          payments: tefResults,
          nfceNumber: result.nfceNumber,
        });
      } catch (err: any) {
        toast.error(`Erro ao finalizar venda: ${err.message}`);
      }
    }
    setShowTEF(false);
  };

  return (
    <div className="flex h-screen pos-screen relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-[340px] z-10 flex items-center justify-between px-4 h-12 border-b border-pos-border bg-pos-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
            title="Voltar ao sistema"
          >
            <ArrowLeft className="w-4 h-4" />
            Sair do PDV
          </button>
          <div className="h-5 w-px bg-pos-border" />
          <span className="text-xs font-semibold text-pos-text">PDV Fiscal</span>
        </div>

        <div className="flex items-center gap-2">
          {pdv.pendingCount > 0 && (
            <button
              onClick={pdv.syncAll}
              disabled={pdv.syncing || !pdv.isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-warning hover:bg-pos-surface-hover transition-all text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pdv.syncing ? "animate-spin" : ""}`} />
              {pdv.pendingCount} pendentes
            </button>
          )}
          {pdv.stats.failed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {pdv.stats.failed} erros
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-xs font-medium">
            {pdv.isOnline ? (
              <><Wifi className="w-3.5 h-3.5 text-success" /><span className="text-success">Online</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-warning" /><span className="text-warning">Offline</span></>
            )}
          </div>
          <button
            onClick={() => setShowCashRegister(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Caixa
          </button>
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
            title="Tela cheia (F11)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
            title="Atalhos do teclado (F1)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product area */}
      <div className="flex-1 min-w-0 pt-12">
        <PDVProductGrid
          products={pdv.products}
          loading={pdv.loadingProducts}
          onAddToCart={pdv.addToCart}
        />
      </div>

      {/* Cart sidebar */}
      <div className="w-[340px] flex-shrink-0">
        <PDVCart
          items={pdv.cartItems}
          onUpdateQuantity={pdv.updateQuantity}
          onRemoveItem={pdv.removeItem}
          onClearCart={pdv.clearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* TEF Processor overlay */}
      <AnimatePresence>
        {showTEF && (
          <TEFProcessor
            total={pdv.total}
            onComplete={handleTEFComplete}
            onCancel={() => setShowTEF(false)}
          />
        )}
      </AnimatePresence>

      {/* Receipt overlay */}
      <AnimatePresence>
        {receipt && (
          <SaleReceipt
            items={receipt.items.map((i) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              category: i.category || "",
              sku: i.sku,
              ncm: i.ncm || "",
              unit: i.unit,
              stock: i.stock_quantity,
              quantity: i.quantity,
            }))}
            total={receipt.total}
            payments={receipt.payments}
            nfceNumber={receipt.nfceNumber}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* Cash Register overlay */}
      <AnimatePresence>
        {showCashRegister && (
          <CashRegister onClose={() => setShowCashRegister(false)} />
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Atalhos do Teclado</h2>
              </div>
              <div className="space-y-2">
                {[
                  { key: "F1", action: "Mostrar/ocultar atalhos" },
                  { key: "F2", action: "Finalizar venda (pagamento)" },
                  { key: "F3", action: "Buscar produto" },
                  { key: "F4", action: "Abrir caixa" },
                  { key: "F6", action: "Limpar carrinho" },
                  { key: "F9", action: "Sincronizar pendentes" },
                  { key: "Delete", action: "Remover último item" },
                  { key: "ESC", action: "Fechar janela/overlay" },
                ].map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">{action}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-mono font-semibold text-foreground">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
