import { useState, useCallback } from "react";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVCart } from "@/components/pdv/PDVCart";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { usePDV } from "@/hooks/usePDV";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence } from "framer-motion";
import { DollarSign, Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
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
  const [showTEF, setShowTEF] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: typeof pdv.cartItems;
    total: number;
    payments: TEFResult[];
    nfceNumber: string;
  } | null>(null);

  useBarcodeScanner(pdv.handleBarcodeScan);

  const handleCheckout = () => {
    if (pdv.cartItems.length > 0) setShowTEF(true);
  };

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
    <div className="flex h-full pos-screen relative">
      {/* Status bar */}
      <div className="absolute top-3 right-[354px] z-10 flex items-center gap-2">
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
      </div>

      {/* Product area */}
      <div className="flex-1 min-w-0">
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
    </div>
  );
}
