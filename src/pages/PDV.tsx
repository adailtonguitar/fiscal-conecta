import { useState, useCallback, useEffect } from "react";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVCart } from "@/components/pdv/PDVCart";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { usePDV } from "@/hooks/usePDV";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Keyboard, ArrowLeft, Maximize, ScanBarcode, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentResult } from "@/services/types";

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
  const [barcodeInput, setBarcodeInput] = useState("");

  useBarcodeScanner(pdv.handleBarcodeScan);

  const handleCheckout = useCallback(() => {
    if (pdv.cartItems.length > 0) setShowTEF(true);
  }, [pdv.cartItems.length]);

  // Barcode manual input
  const handleBarcodeSubmit = () => {
    const query = barcodeInput.trim();
    if (!query) return;

    // Try exact match first (barcode/sku/id)
    const exactMatch = pdv.products.find(
      (p) => p.sku === query || p.barcode === query || p.id === query
    );
    if (exactMatch) {
      pdv.addToCart(exactMatch);
      toast.success(`${exactMatch.name} adicionado`);
      setBarcodeInput("");
      return;
    }

    // Try partial name/sku search
    const searchMatch = pdv.products.find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
    );
    if (searchMatch) {
      pdv.addToCart(searchMatch);
      toast.success(`${searchMatch.name} adicionado`);
    } else {
      toast.error(`Produto não encontrado: ${query}`);
    }
    setBarcodeInput("");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (showTEF || receipt || showCashRegister) {
        if (e.key === "Escape") {
          e.preventDefault();
          if (receipt) setReceipt(null);
          else if (showCashRegister) setShowCashRegister(false);
        }
        return;
      }

      switch (e.key) {
        case "F2": e.preventDefault(); handleCheckout(); break;
        case "F3":
          e.preventDefault();
          document.querySelector<HTMLInputElement>('[data-pdv-search]')?.focus();
          break;
        case "F4": e.preventDefault(); setShowCashRegister(true); break;
        case "F6":
          e.preventDefault();
          if (pdv.cartItems.length > 0) { pdv.clearCart(); toast.info("Carrinho limpo"); }
          break;
        case "F9":
          e.preventDefault();
          if (pdv.pendingCount > 0 && pdv.isOnline) pdv.syncAll();
          break;
        case "F1": e.preventDefault(); setShowShortcuts((prev) => !prev); break;
        case "Escape": e.preventDefault(); setShowShortcuts(false); break;
        case "Delete":
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
    <div className="flex flex-col h-screen pos-screen relative overflow-hidden">
      {/* ===== TOP HEADER BAR ===== */}
      <div className="flex items-center justify-between px-4 h-11 bg-[hsl(220,35%,22%)] border-b border-pos-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Sair
          </button>
          <div className="h-4 w-px bg-pos-border" />
          <span className="text-sm font-bold text-pos-text tracking-wide">PDV</span>
          <div className="h-4 w-px bg-pos-border" />
          {/* Status: Caixa Aberto */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-success/20 border border-success/30">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold text-success uppercase tracking-wider">Caixa Aberto</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pdv.pendingCount > 0 && (
            <button
              onClick={pdv.syncAll}
              disabled={pdv.syncing || !pdv.isOnline}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-pos-surface border border-pos-border text-warning hover:bg-pos-surface-hover transition-all text-xs font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${pdv.syncing ? "animate-spin" : ""}`} />
              {pdv.pendingCount}
            </button>
          )}
          {pdv.stats.failed > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              {pdv.stats.failed}
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-pos-surface border border-pos-border text-xs font-medium">
            {pdv.isOnline ? (
              <><Wifi className="w-3 h-3 text-success" /><span className="text-success">Online</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-warning" /><span className="text-warning">Offline</span></>
            )}
          </div>
          <button
            onClick={() => setShowCashRegister(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
          >
            <DollarSign className="w-3 h-3" />
            Caixa
          </button>
          <button
            onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}
            className="p-1.5 rounded bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all"
            title="Tela cheia"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            className="p-1.5 rounded bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all"
            title="Atalhos (F1)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL: Barcode + Cart Items */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Barcode input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-pos-border bg-[hsl(220,30%,14%)]">
            <ScanBarcode className="w-4 h-4 text-pos-accent flex-shrink-0" />
            <span className="text-xs text-pos-text-muted font-medium whitespace-nowrap">CÓDIGO DE BARRAS:</span>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBarcodeSubmit();
                }
              }}
              placeholder="Leia ou digite o código..."
              className="flex-1 px-3 py-1.5 rounded bg-pos-surface border border-pos-border text-pos-text text-xs font-mono focus:outline-none focus:ring-1 focus:ring-pos-accent/40 focus:border-pos-accent transition-all"
            />
            <button
              onClick={handleBarcodeSubmit}
              className="px-3 py-1.5 rounded bg-pos-accent text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
            >
              OK
            </button>
          </div>

          {/* Cart items table */}
          <PDVCart
            items={pdv.cartItems}
            onUpdateQuantity={pdv.updateQuantity}
            onRemoveItem={pdv.removeItem}
            onClearCart={pdv.clearCart}
            onCheckout={handleCheckout}
          />
        </div>

        {/* RIGHT PANEL: Product list */}
        <div className="w-[340px] flex-shrink-0 border-l border-pos-border">
          <PDVProductGrid
            products={pdv.products}
            loading={pdv.loadingProducts}
            onAddToCart={pdv.addToCart}
          />
        </div>
      </div>

      {/* ===== OVERLAYS ===== */}
      <AnimatePresence>
        {showTEF && (
          <TEFProcessor total={pdv.total} onComplete={handleTEFComplete} onCancel={() => setShowTEF(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receipt && (
          <SaleReceipt
            items={receipt.items.map((i) => ({
              id: i.id, name: i.name, price: i.price, category: i.category || "",
              sku: i.sku, ncm: i.ncm || "", unit: i.unit, stock: i.stock_quantity, quantity: i.quantity,
            }))}
            total={receipt.total}
            payments={receipt.payments}
            nfceNumber={receipt.nfceNumber}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCashRegister && <CashRegister onClose={() => setShowCashRegister(false)} />}
      </AnimatePresence>

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
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
                    <kbd className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-mono font-semibold text-foreground">{key}</kbd>
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
