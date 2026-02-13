import { useState, useCallback, useEffect, useRef } from "react";
import { isScaleBarcode } from "@/lib/scale-barcode";
import { usePermissions } from "@/hooks/usePermissions";
import { useLoyalty } from "@/hooks/useLoyalty";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVLoyaltyClientList } from "@/components/pdv/PDVLoyaltyClientList";
import { PDVCart } from "@/components/pdv/PDVCart";
import { PDVQuickProductDialog } from "@/components/pdv/PDVQuickProductDialog";
import { PDVClientSelector, type CreditClient } from "@/components/pdv/PDVClientSelector";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { StockMovementDialog } from "@/components/stock/StockMovementDialog";
import { PDVReceiveCreditDialog } from "@/components/pdv/PDVReceiveCreditDialog";
import { usePDV, type PDVProduct } from "@/hooks/usePDV";
import { useQuotes } from "@/hooks/useQuotes";
import { useCompany } from "@/hooks/useCompany";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence, motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Keyboard, ArrowLeft, Maximize, ScanBarcode, DollarSign, PackageX, PackagePlus, LockOpen, User, X, GraduationCap, Search, Repeat, Monitor, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentResult } from "@/services/types";
import { openCashDrawer } from "@/lib/escpos";

export default function PDV() {
  const pdv = usePDV();
  const navigate = useNavigate();
  const { companyName, logoUrl, slogan, pixKey, pixKeyType, pixCity } = useCompany();
  const { maxDiscountPercent } = usePermissions();
  const { earnPoints, isActive: loyaltyActive } = useLoyalty();
  const { createQuote } = useQuotes();
  const [showSaveQuote, setShowSaveQuote] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState("");
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
  const [selectedClient, setSelectedClient] = useState<CreditClient | null>(null);
  const [showLoyaltyClientSelector, setShowLoyaltyClientSelector] = useState(false);
  const [showPriceLookup, setShowPriceLookup] = useState(false);
  const [priceLookupQuery, setPriceLookupQuery] = useState("");
  const [terminalId, setTerminalId] = useState(() => localStorage.getItem("pdv_terminal_id") || "01");
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);
  const [tempTerminalId, setTempTerminalId] = useState(terminalId);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useBarcodeScanner(pdv.handleBarcodeScan);

  // Load session for current terminal on mount and terminal change
  useEffect(() => {
    pdv.reloadSession(terminalId);
  }, [terminalId]);

  // Auto-open cash register dialog if no session is open
  useEffect(() => {
    if (!pdv.loadingSession && !pdv.currentSession && !showCashRegister) {
      setShowCashRegister(true);
    }
  }, [pdv.loadingSession, pdv.currentSession]);

  // Auto-focus barcode input on mount and after closing receipt
  useEffect(() => {
    if (!showTEF && !receipt && !showCashRegister && !showProductList) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [showTEF, receipt, showCashRegister, showProductList]);

  // Load quote from sessionStorage (when converting from Orçamentos page)
  useEffect(() => {
    const raw = sessionStorage.getItem("pdv_load_quote");
    if (raw && pdv.products.length > 0) {
      sessionStorage.removeItem("pdv_load_quote");
      try {
        const { items, clientName } = JSON.parse(raw);
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const product = pdv.products.find((p) => p.id === item.product_id);
            if (product) {
              for (let i = 0; i < (item.quantity || 1); i++) {
                pdv.addToCart(product);
              }
            }
          });
          if (clientName) toast.info(`Orçamento carregado — Cliente: ${clientName}`);
          else toast.info("Orçamento carregado no carrinho");
        }
      } catch { /* ignore */ }
    }
  }, [pdv.products.length]);

  const handleSaveQuote = async () => {
    if (pdv.cartItems.length === 0) {
      toast.warning("Carrinho vazio");
      return;
    }
    try {
      const items = pdv.cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        unit: item.unit,
      }));
      await createQuote({
        items,
        subtotal: pdv.subtotal,
        discountPercent: pdv.globalDiscountPercent,
        discountValue: pdv.globalDiscountValue,
        total: pdv.total,
        clientName: selectedClient?.name,
        clientId: selectedClient?.id,
        notes: quoteNotes || undefined,
        validDays: 30,
      });
      toast.success("Orçamento salvo com sucesso!");
      pdv.clearCart();
      setSelectedClient(null);
      setShowSaveQuote(false);
      setQuoteNotes("");
    } catch (err: any) {
      toast.error(`Erro ao salvar orçamento: ${err.message}`);
    }
  };

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
          if (pdv.cartItems.length > 0) { pdv.clearCart(); setSelectedClient(null); toast.info("Carrinho limpo"); }
          break;
        case "F7": e.preventDefault(); openCashDrawer(); toast.info("Gaveta aberta"); break;
        case "F8": e.preventDefault(); setShowReceiveCredit(true); break;
        case "F9":
          e.preventDefault();
          if (pdv.pendingCount > 0 && pdv.isOnline) pdv.syncAll();
          break;
        case "F10": e.preventDefault(); setShowPriceLookup(true); setPriceLookupQuery(""); break;
        case "F11": e.preventDefault(); pdv.repeatLastSale(); break;
        case "F12": e.preventDefault(); pdv.setTrainingMode(!pdv.trainingMode); toast.info(pdv.trainingMode ? "Modo treinamento DESATIVADO" : "🎓 Modo treinamento ATIVADO"); break;
        case "F1": e.preventDefault(); setShowShortcuts((prev) => !prev); break;
        case "Escape": e.preventDefault(); setShowShortcuts(false); setShowPriceLookup(false); break;
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
        const savedClient = selectedClient;
        const result = await pdv.finalizeSale(paymentResults);
        setReceipt({
          items: savedItems,
          total: savedTotal,
          payments: tefResults,
          nfceNumber: result.nfceNumber,
        });
        setSelectedClient(null);
        // Award loyalty points if client was identified
        if (loyaltyActive && savedClient?.id) {
          const pts = await earnPoints(savedClient.id, savedTotal, result.fiscalDocId);
          if (pts > 0) toast.info(`🎁 ${savedClient.name} ganhou ${pts} pontos de fidelidade!`);
        }
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
      setSelectedClient(null);
      // Award loyalty points
      if (loyaltyActive && client.id) {
        const pts = await earnPoints(client.id, savedTotal, result.fiscalDocId);
        if (pts > 0) toast.info(`🎁 ${client.name} ganhou ${pts} pontos de fidelidade!`);
      }
    } catch (err: any) {
      toast.error(`Erro ao finalizar venda a prazo: ${err.message}`);
    }
  };

  return (
    <div className={`pdv-theme flex flex-col h-screen bg-background text-foreground relative overflow-hidden ${pdv.trainingMode ? "ring-4 ring-warning/50 ring-inset" : ""}`}>
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
          {/* Terminal ID */}
          <button
            onClick={() => { setTempTerminalId(terminalId); setShowTerminalPicker(true); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border hover:bg-accent transition-all cursor-pointer"
            title="Trocar terminal"
          >
            <Monitor className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground font-mono">T{terminalId}</span>
          </button>
          <div className="h-4 w-px bg-border" />
          {/* Status: Caixa */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded border ${
            pdv.trainingMode 
              ? "bg-warning/20 border-warning/30" 
              : pdv.currentSession 
                ? "bg-success/20 border-success/30" 
                : "bg-destructive/20 border-destructive/30"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              pdv.trainingMode 
                ? "bg-warning animate-pulse" 
                : pdv.currentSession 
                  ? "bg-success animate-pulse" 
                  : "bg-destructive"
            }`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${
              pdv.trainingMode 
                ? "text-warning" 
                : pdv.currentSession 
                  ? "text-success" 
                  : "text-destructive"
            }`}>
              {pdv.trainingMode ? "🎓 Treinamento" : pdv.currentSession ? "Caixa Aberto" : "Caixa Fechado"}
            </span>
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
            onClick={() => { pdv.setTrainingMode(!pdv.trainingMode); toast.info(pdv.trainingMode ? "Modo treinamento DESATIVADO" : "🎓 Modo treinamento ATIVADO"); }}
            className={`p-1.5 rounded border transition-all ${pdv.trainingMode ? "bg-warning/20 border-warning/30 text-warning" : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}
            title="Modo Treinamento (F12)"
          >
            <GraduationCap className="w-3.5 h-3.5" />
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
        <div className="h-4 w-px bg-border mx-1" />
        {selectedClient ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <User className="w-3 h-3" />
            <span className="font-bold truncate max-w-[120px]">{selectedClient.name}</span>
            {loyaltyActive && <span className="text-[10px] opacity-70">🎁</span>}
            <button
              onClick={() => setSelectedClient(null)}
              className="ml-1 p-0.5 rounded hover:bg-primary/20 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoyaltyClientSelector(true)}
            className="px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-foreground text-xs font-medium hover:bg-accent transition-all flex items-center gap-1.5"
          >
            <User className="w-3 h-3" />
            Cliente {loyaltyActive && "🎁"}
          </button>
        )}
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
          <TEFProcessor total={pdv.total} onComplete={handleTEFComplete} onCancel={() => setShowTEF(false)} onPrazoRequested={handlePrazoRequested} pixConfig={pixKey ? { pixKey, pixKeyType: pixKeyType || undefined, merchantName: companyName || "LOJA", merchantCity: pixCity || "SAO PAULO" } : null} />
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

      {/* Loyalty client selector */}
      <AnimatePresence>
        {showLoyaltyClientSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoyaltyClientSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Identificar Cliente {loyaltyActive && "🎁"}</h2>
                <button onClick={() => setShowLoyaltyClientSelector(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              {loyaltyActive && (
                <div className="px-5 py-2 bg-primary/5 border-b border-border">
                  <p className="text-xs text-primary">Identifique o cliente para acumular pontos de fidelidade automaticamente.</p>
                </div>
              )}
              <PDVLoyaltyClientList
                onSelect={(client) => {
                  setSelectedClient(client);
                  setShowLoyaltyClientSelector(false);
                  toast.success(`Cliente: ${client.name}`);
                }}
              />
            </motion.div>
          </motion.div>
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
        {showCashRegister && (
          <CashRegister
            terminalId={terminalId}
            onClose={() => {
              setShowCashRegister(false);
              pdv.reloadSession(terminalId);
            }}
          />
        )}
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

      {/* Price Lookup Dialog */}
      <AnimatePresence>
        {showPriceLookup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPriceLookup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Consulta de Preço
                </h2>
                <button onClick={() => setShowPriceLookup(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <input
                  type="text"
                  value={priceLookupQuery}
                  onChange={(e) => setPriceLookupQuery(e.target.value)}
                  placeholder="Digite código de barras, SKU ou nome..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {priceLookupQuery.trim().length >= 2 && pdv.products
                    .filter((p) =>
                      p.name.toLowerCase().includes(priceLookupQuery.toLowerCase()) ||
                      p.sku.toLowerCase().includes(priceLookupQuery.toLowerCase()) ||
                      (p.barcode && p.barcode.includes(priceLookupQuery))
                    )
                    .slice(0, 10)
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border">
                        <div>
                          <p className="text-sm font-bold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">SKU: {p.sku} {p.barcode && `| CB: ${p.barcode}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-primary font-mono">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.price)}
                          </p>
                          <p className={`text-xs font-mono ${p.stock_quantity > 0 ? "text-success" : "text-destructive"}`}>
                            Estoque: {p.stock_quantity} {p.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  {priceLookupQuery.trim().length >= 2 && pdv.products.filter((p) =>
                    p.name.toLowerCase().includes(priceLookupQuery.toLowerCase()) ||
                    p.sku.toLowerCase().includes(priceLookupQuery.toLowerCase()) ||
                    (p.barcode && p.barcode.includes(priceLookupQuery))
                  ).length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum produto encontrado</p>
                  )}
                  {priceLookupQuery.trim().length < 2 && (
                    <p className="text-center text-sm text-muted-foreground py-8">Digite ao menos 2 caracteres para buscar</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Quote Dialog */}
      <AnimatePresence>
        {showSaveQuote && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSaveQuote(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Salvar Orçamento
                </h2>
                <button onClick={() => setShowSaveQuote(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{pdv.cartItems.length} item(ns) no carrinho</p>
                  <p className="text-2xl font-black font-mono text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pdv.total)}
                  </p>
                </div>
                {selectedClient && (
                  <div className="text-sm text-foreground">
                    Cliente: <strong>{selectedClient.name}</strong>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Observações (opcional)</label>
                  <textarea
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Validade 30 dias, condições especiais..."
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveQuote(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveQuote}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Salvar Orçamento
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Picker Modal */}
      <AnimatePresence>
        {showTerminalPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowTerminalPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-2xl border border-border card-shadow w-full max-w-sm mx-4 p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Selecionar Terminal</h3>
                  <p className="text-xs text-muted-foreground">Identificação deste ponto de venda</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["01", "02", "03", "04", "05", "06", "07", "08"].map((tid) => (
                  <button
                    key={tid}
                    onClick={() => setTempTerminalId(tid)}
                    className={`py-3 rounded-xl text-sm font-bold font-mono transition-all ${
                      tempTerminalId === tid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    T{tid}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Ou digite o número:</label>
                <input
                  type="text"
                  maxLength={3}
                  value={tempTerminalId}
                  onChange={(e) => setTempTerminalId(e.target.value.replace(/\D/g, "").padStart(2, "0").slice(-2))}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTerminalPicker(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const newId = tempTerminalId || "01";
                    setTerminalId(newId);
                    localStorage.setItem("pdv_terminal_id", newId);
                    setShowTerminalPicker(false);
                    toast.success(`Terminal alterado para T${newId}`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sidebar-background border-t border-border flex-shrink-0 flex-wrap">
        {[
          { key: "F1", label: "Atalhos", action: () => setShowShortcuts((p) => !p) },
          { key: "F2", label: "Pagamento", action: handleCheckout },
          { key: "F3", label: "Buscar", action: () => setShowProductList((p) => !p) },
          { key: "F4", label: "Caixa", action: () => setShowCashRegister(true) },
          { key: "F5", label: "Cadastrar", action: () => { setQuickProductBarcode(""); setShowQuickProduct(true); } },
          { key: "F6", label: "Limpar", action: () => { if (pdv.cartItems.length > 0) { pdv.clearCart(); setSelectedClient(null); toast.info("Carrinho limpo"); } } },
          { key: "F7", label: "Gaveta", action: () => { openCashDrawer(); toast.info("Gaveta aberta"); } },
          { key: "F8", label: "Receber Fiado", action: () => setShowReceiveCredit(true) },
          { key: "F9", label: "Sincronizar", action: () => { if (pdv.pendingCount > 0 && pdv.isOnline) pdv.syncAll(); } },
          { key: "F10", label: "Consultar Preço", action: () => { setShowPriceLookup(true); setPriceLookupQuery(""); } },
          { key: "F11", label: "Repetir Venda", action: () => pdv.repeatLastSale() },
          { key: "F12", label: "Treinamento", action: () => { pdv.setTrainingMode(!pdv.trainingMode); toast.info(pdv.trainingMode ? "Modo treinamento DESATIVADO" : "🎓 Modo treinamento ATIVADO"); } },
          { key: "Del", label: "Remover", action: () => { if (pdv.cartItems.length > 0) { const last = pdv.cartItems[pdv.cartItems.length - 1]; pdv.removeItem(last.id); toast.info(`${last.name} removido`); } } },
          { key: "ESC", label: "Fechar", action: () => setShowShortcuts(false) },
          { key: "ORC", label: "Orçamento", action: () => { if (pdv.cartItems.length > 0) setShowSaveQuote(true); else toast.warning("Carrinho vazio"); } },
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
