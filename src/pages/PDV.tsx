import { useState, useCallback, useEffect, useRef } from "react";
import { isScaleBarcode } from "@/lib/scale-barcode";
import { usePermissions } from "@/hooks/usePermissions";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVCart } from "@/components/pdv/PDVCart";
import { PDVQuickProductDialog } from "@/components/pdv/PDVQuickProductDialog";
import { PDVClientSelector, type CreditClient } from "@/components/pdv/PDVClientSelector";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { StockMovementDialog } from "@/components/stock/StockMovementDialog";
import { PDVReceiveCreditDialog } from "@/components/pdv/PDVReceiveCreditDialog";
import { usePDV, type PDVProduct } from "@/hooks/usePDV";
import { useCompany } from "@/hooks/useCompany";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Keyboard, ArrowLeft, Maximize, ScanBarcode, DollarSign, PackageX, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentResult } from "@/services/types";

export default function PDV() {
  const pdv = usePDV();
  const navigate = useNavigate();
  const { companyName, logoUrl, slogan } = useCompany();
  const { maxDiscountPercent } = usePermissions();
  const [showTEF, setShowTEF] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: typeof pdv.cartItems;
    total: number;
    payments: TEFResult[];
    nfceNumber: string;
  } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null);
  const [zeroStockProduct, setZeroStockProduct] = useState<PDVProduct | null>(null);
  const [stockMovementProduct, setStockMovementProduct] = useState<PDVProduct | null>(null);
  const [showQuickProduct, setShowQuickProduct] = useState(false);
  const [quickProductBarcode, setQuickProductBarcode] = useState("");
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showReceiveCredit, setShowReceiveCredit] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useBarcodeScanner(pdv.handleBarcodeScan);

  // Auto-focus barcode input on mount and after closing receipt
  useEffect(() => {
    if (!showTEF && !receipt && !showCashRegister && !showProductList) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [showTEF, receipt, showCashRegister, showProductList]);

  const handleCheckout = useCallback(() => {
    if (pdv.cartItems.length > 0) setShowTEF(true);
  }, [pdv.cartItems.length]);

  // Barcode manual input
  const handleBarcodeSubmit = () => {
    const query = barcodeInput.trim();
    if (!query) return;

    // Scale barcode — delegate to PDV hook
    if (isScaleBarcode(query)) {
      pdv.handleBarcodeScan(query);
      setBarcodeInput("");
      return;
    }

    // Try exact match first (barcode/sku/id/ncm)
    const exactMatch = pdv.products.find(
      (p) => p.sku === query || p.barcode === query || p.id === query || p.ncm === query
    );
    if (exactMatch) {
      if (exactMatch.stock_quantity <= 0) {
        setZeroStockProduct(exactMatch);
        setBarcodeInput("");
        return;
      }
      pdv.addToCart(exactMatch);
      toast.success(`${exactMatch.name} adicionado`);
      setBarcodeInput("");
      return;
    }

    // Try partial name/sku/ncm search
    const searchMatch = pdv.products.find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        (p.ncm && p.ncm.includes(query))
    );
    if (searchMatch) {
      if (searchMatch.stock_quantity <= 0) {
        setZeroStockProduct(searchMatch);
        setBarcodeInput("");
        return;
      }
      pdv.addToCart(searchMatch);
      toast.success(`${searchMatch.name} adicionado`);
    } else {
      toast.error(`Produto não encontrado: ${query}`, {
        action: {
          label: "Cadastrar",
          onClick: () => {
            setQuickProductBarcode(query);
            setShowQuickProduct(true);
          },
        },
      });
    }
    setBarcodeInput("");
  };

  // Wrapper for grid add that checks stock
  const handleAddToCart = useCallback((product: PDVProduct) => {
    if (product.stock_quantity <= 0) {
      setZeroStockProduct(product);
      return;
    }
    const added = pdv.addToCart(product);
    if (added) {
      toast.success(`${product.name} adicionado`);
    }
  }, [pdv]);

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
          setShowProductList((p) => !p);
          break;
        case "F4": e.preventDefault(); setShowCashRegister(true); break;
        case "F5": e.preventDefault(); setQuickProductBarcode(""); setShowQuickProduct(true); break;
        case "F6":
          e.preventDefault();
          if (pdv.cartItems.length > 0) { pdv.clearCart(); toast.info("Carrinho limpo"); }
          break;
        case "F8": e.preventDefault(); setShowReceiveCredit(true); break;
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
          method: r.method as PaymentResult["method"],
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

  const handlePrazoRequested = () => {
    setShowTEF(false);
    setShowClientSelector(true);
  };

  const handleCreditSaleConfirmed = async (client: CreditClient, mode: "fiado" | "parcelado", installments: number) => {
    setShowClientSelector(false);
    try {
      const paymentResults: PaymentResult[] = [{
        method: "prazo",
        approved: true,
        amount: pdv.total,
        credit_client_id: client.id,
        credit_client_name: client.name,
        credit_mode: mode,
        credit_installments: installments,
      }];
      const savedItems = [...pdv.cartItems];
      const savedTotal = pdv.total;
      const result = await pdv.finalizeSale(paymentResults);
      setReceipt({
        items: savedItems,
        total: savedTotal,
        payments: [{
          method: "prazo" as any,
          approved: true,
          amount: savedTotal,
        }],
        nfceNumber: result.nfceNumber,
      });
      toast.success(`Venda a prazo registrada para ${client.name}`);
    } catch (err: any) {
      toast.error(`Erro ao finalizar venda a prazo: ${err.message}`);
    }
  };

  return (
    <div className="pdv-theme flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* ===== TOP HEADER BAR ===== */}
      <div className="flex items-center justify-between px-4 h-11 bg-sidebar-background border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Sair
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-bold text-sidebar-foreground tracking-wide">PDV</span>
          <div className="h-4 w-px bg-border" />
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted border border-border text-warning hover:bg-accent transition-all text-xs font-medium"
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
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted border border-border text-xs font-medium">
            {pdv.isOnline ? (
              <><Wifi className="w-3 h-3 text-success" /><span className="text-success">Online</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-warning" /><span className="text-warning">Offline</span></>
            )}
          </div>
          <button
            onClick={() => setShowCashRegister(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs font-medium"
          >
            <DollarSign className="w-3 h-3" />
            Caixa
          </button>
          <button
            onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()}
            className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            title="Tela cheia"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowShortcuts((p) => !p)}
            className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            title="Atalhos (F1)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===== BARCODE INPUT ===== */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar-background flex-shrink-0">
        <ScanBarcode className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">CÓDIGO DE BARRAS:</span>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              if (!barcodeInput.trim()) {
                setShowProductList((p) => !p);
              } else {
                handleBarcodeSubmit();
              }
            }
          }}
          placeholder="Leia ou digite o código..."
          className="flex-1 px-3 py-1.5 rounded bg-card border border-border text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
        />
        <button
          onClick={handleBarcodeSubmit}
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
        >
          OK
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <button
          onClick={() => setShowProductList((p) => !p)}
          className="px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground text-xs font-medium hover:bg-accent transition-all"
        >
          {showProductList ? "Ocultar Produtos" : "Mostrar Produtos (F3)"}
        </button>
        <button
          onClick={() => { setQuickProductBarcode(""); setShowQuickProduct(true); }}
          className="px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all flex items-center gap-1.5"
        >
          <PackagePlus className="w-3 h-3" />
          Cadastrar (F5)
        </button>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 min-h-0 relative">
        {/* FULL WIDTH: Cart with customer-facing layout */}
        <div className="flex flex-col flex-1 min-w-0">
          <PDVCart
            items={pdv.cartItems}
            onUpdateQuantity={pdv.updateQuantity}
            onRemoveItem={pdv.removeItem}
            onClearCart={pdv.clearCart}
            onCheckout={handleCheckout}
            selectedItemId={selectedCartItemId}
            onSelectItem={setSelectedCartItemId}
            companyName={companyName}
            logoUrl={logoUrl}
            maxDiscountPercent={maxDiscountPercent}
            itemDiscounts={pdv.itemDiscounts}
            onSetItemDiscount={pdv.setItemDiscount}
            globalDiscountPercent={pdv.globalDiscountPercent}
            onSetGlobalDiscount={pdv.setGlobalDiscountPercent}
            subtotal={pdv.subtotal}
            globalDiscountValue={pdv.globalDiscountValue}
          />
        </div>

        {/* PRODUCT LIST: fullscreen overlay */}
        <AnimatePresence>
          {showProductList && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 bg-background"
            >
              <PDVProductGrid
                products={pdv.products}
                loading={pdv.loadingProducts}
                onAddToCart={(product) => {
                  handleAddToCart(product);
                  setShowProductList(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== OVERLAYS ===== */}
      <AnimatePresence>
        {showTEF && (
          <TEFProcessor total={pdv.total} onComplete={handleTEFComplete} onCancel={() => setShowTEF(false)} onPrazoRequested={handlePrazoRequested} />
        )}
      </AnimatePresence>

      {/* Client selector for credit sales */}
      <AnimatePresence>
        {showClientSelector && (
          <PDVClientSelector
            open={showClientSelector}
            onClose={() => setShowClientSelector(false)}
            onSelect={handleCreditSaleConfirmed}
            saleTotal={pdv.total}
          />
        )}
      </AnimatePresence>

      {/* Receive credit dialog */}
      <AnimatePresence>
        {showReceiveCredit && (
          <PDVReceiveCreditDialog open={showReceiveCredit} onClose={() => setShowReceiveCredit(false)} />
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
            slogan={slogan || undefined}
            logoUrl={logoUrl || undefined}
            companyName={companyName || undefined}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCashRegister && <CashRegister onClose={() => setShowCashRegister(false)} />}
      </AnimatePresence>

      {/* Zero stock dialog */}
      <AnimatePresence>
        {zeroStockProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setZeroStockProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm mx-4"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <PackageX className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Produto sem Estoque</h2>
                <p className="text-sm text-muted-foreground">
                  <strong>{zeroStockProduct.name}</strong> está com estoque zerado e não pode ser vendido.
                </p>
                <p className="text-xs text-muted-foreground">
                  Deseja adicionar estoque agora?
                </p>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setZeroStockProduct(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={() => {
                      setStockMovementProduct(zeroStockProduct);
                      setZeroStockProduct(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                  >
                    Adicionar Estoque
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock movement dialog from PDV */}
      {stockMovementProduct && (
        <StockMovementDialog
          open={!!stockMovementProduct}
          onOpenChange={(v) => {
            if (!v) {
              setStockMovementProduct(null);
              pdv.refreshProducts();
            }
          }}
          product={{
            ...stockMovementProduct,
            id: stockMovementProduct.id,
            name: stockMovementProduct.name,
            sku: stockMovementProduct.sku,
            unit: stockMovementProduct.unit,
            stock_quantity: stockMovementProduct.stock_quantity,
            price: stockMovementProduct.price,
            is_active: true,
            created_at: "",
            updated_at: "",
            company_id: "",
            ncm: stockMovementProduct.ncm,
            category: stockMovementProduct.category,
            barcode: stockMovementProduct.barcode,
            cost_price: null,
            min_stock: null,
            origem: 0,
            cfop: "5102",
            cest: null,
            csosn: "102",
            cst_icms: "00",
            aliq_icms: 0,
            cst_pis: "01",
            aliq_pis: 1.65,
            cst_cofins: "01",
            aliq_cofins: 7.60,
            gtin_tributavel: null,
            fiscal_category_id: null,
          }}
        />
      )}

      {/* Quick product registration from PDV */}
      <PDVQuickProductDialog
        open={showQuickProduct}
        onOpenChange={setShowQuickProduct}
        initialBarcode={quickProductBarcode}
        onProductCreated={() => pdv.refreshProducts()}
      />

      {/* Fixed shortcuts bar at bottom */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sidebar-background border-t border-border flex-shrink-0 flex-wrap">
        {[
          { key: "F1", label: "Atalhos", action: () => setShowShortcuts((p) => !p) },
          { key: "F2", label: "Pagamento", action: handleCheckout },
          { key: "F3", label: "Buscar", action: () => setShowProductList((p) => !p) },
          { key: "F4", label: "Caixa", action: () => setShowCashRegister(true) },
          { key: "F5", label: "Cadastrar", action: () => { setQuickProductBarcode(""); setShowQuickProduct(true); } },
          { key: "F6", label: "Limpar", action: () => { if (pdv.cartItems.length > 0) { pdv.clearCart(); toast.info("Carrinho limpo"); } } },
          { key: "F8", label: "Receber Fiado", action: () => setShowReceiveCredit(true) },
          { key: "F9", label: "Sincronizar", action: () => { if (pdv.pendingCount > 0 && pdv.isOnline) pdv.syncAll(); } },
          { key: "Del", label: "Remover", action: () => { if (pdv.cartItems.length > 0) { const last = pdv.cartItems[pdv.cartItems.length - 1]; pdv.removeItem(last.id); toast.info(`${last.name} removido`); } } },
          { key: "ESC", label: "Fechar", action: () => setShowShortcuts(false) },
        ].map(({ key, label, action }) => (
          <button
            key={key}
            onClick={action}
            className="flex items-center gap-2 px-4 py-2 rounded bg-white/90 hover:bg-white active:bg-white/80 transition-all cursor-pointer shadow-sm border border-white/20"
          >
            <span className="text-xs font-bold text-[hsl(218,50%,18%)] uppercase tracking-wide">{label} [{key}]</span>
          </button>
        ))}
      </div>
    </div>
  );
}
