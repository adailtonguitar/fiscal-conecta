import { useState, useCallback, useEffect, useRef } from "react";
import { isScaleBarcode } from "@/lib/scale-barcode";
import { usePermissions } from "@/hooks/usePermissions";
import { useLoyalty } from "@/hooks/useLoyalty";
import { PDVProductGrid } from "@/components/pdv/PDVProductGrid";
import { PDVLoyaltyClientList } from "@/components/pdv/PDVLoyaltyClientList";
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
import { useTEFConfig } from "@/hooks/useTEFConfig";
import { Wifi, WifiOff, Keyboard, X, Search, Monitor, FileText, User, PackageX, PackagePlus, Maximize, Minimize, Banknote, CreditCard, QrCode, Smartphone, Ticket, MoreHorizontal, Clock as ClockIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PaymentResult } from "@/services/types";
import { openCashDrawer } from "@/lib/escpos";
import { playAddSound, playErrorSound, playSaleCompleteSound } from "@/lib/pdv-sounds";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function PDV() {
  const pdv = usePDV();
  const navigate = useNavigate();
  const { companyName, companyId, logoUrl, slogan, pixKey, pixKeyType, pixCity } = useCompany();
  const { config: tefConfigData } = useTEFConfig();
  const { maxDiscountPercent } = usePermissions();
  const { earnPoints, isActive: loyaltyActive } = useLoyalty();
  const { createQuote } = useQuotes();
  const [showSaveQuote, setShowSaveQuote] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [showTEF, setShowTEF] = useState(false);
  const [tefDefaultMethod, setTefDefaultMethod] = useState<string | null>(null);
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
  const [editingQtyItemId, setEditingQtyItemId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState("");
  const [editingItemDiscountId, setEditingItemDiscountId] = useState<string | null>(null);
  const [editingGlobalDiscount, setEditingGlobalDiscount] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const tableEndRef = useRef<HTMLTableRowElement>(null);
  const [saleNumber, setSaleNumber] = useState(() => Number(localStorage.getItem("pdv_sale_number") || "1"));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashItemId, setFlashItemId] = useState<string | null>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

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

  // Always re-focus barcode input when no modal is open
  useEffect(() => {
    if (!showTEF && !receipt && !showCashRegister && !showProductList && !showShortcuts && !showPriceLookup && !showLoyaltyClientSelector && !showQuickProduct && !showSaveQuote && !showTerminalPicker && !showClientSelector && !showReceiveCredit && !zeroStockProduct && !editingQtyItemId && !editingItemDiscountId && !editingGlobalDiscount) {
      const t = setTimeout(() => barcodeInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [showTEF, receipt, showCashRegister, showProductList, showShortcuts, showPriceLookup, showLoyaltyClientSelector, showQuickProduct, showSaveQuote, showTerminalPicker, showClientSelector, showReceiveCredit, zeroStockProduct, editingQtyItemId, editingItemDiscountId, editingGlobalDiscount]);

  // Auto-scroll to last item + flash effect
  useEffect(() => {
    if (pdv.cartItems.length > 0) {
      const lastItem = pdv.cartItems[pdv.cartItems.length - 1];
      setFlashItemId(lastItem.id);
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
      flashTimeout.current = setTimeout(() => setFlashItemId(null), 600);
      tableEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [pdv.cartItems.length]);

  // Load quote from sessionStorage
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
    if (pdv.cartItems.length === 0) { toast.warning("Carrinho vazio"); return; }
    try {
      const items = pdv.cartItems.map((item) => ({
        product_id: item.id, name: item.name, sku: item.sku,
        quantity: item.quantity, unit_price: item.price, unit: item.unit,
      }));
      await createQuote({
        items, subtotal: pdv.subtotal, discountPercent: pdv.globalDiscountPercent,
        discountValue: pdv.globalDiscountValue, total: pdv.total,
        clientName: selectedClient?.name, clientId: selectedClient?.id,
        notes: quoteNotes || undefined, validDays: 30,
      });
      toast.success("Orçamento salvo com sucesso!");
      pdv.clearCart(); setSelectedClient(null); setShowSaveQuote(false); setQuoteNotes("");
    } catch (err: any) {
      toast.error(`Erro ao salvar orçamento: ${err.message}`);
    }
  };

  const handleCheckout = useCallback((defaultMethod?: string) => {
    if (pdv.cartItems.length > 0) {
      setTefDefaultMethod(defaultMethod || null);
      setShowTEF(true);
    }
  }, [pdv.cartItems.length]);

  const handleDirectPayment = useCallback((method: string) => {
    if (pdv.cartItems.length === 0) {
      toast.warning("Adicione itens ao carrinho primeiro");
      return;
    }
    if (method === "prazo") {
      handlePrazoRequested();
      return;
    }
    handleCheckout(method);
  }, [pdv.cartItems.length]);

  // Barcode manual input with multiplication support (e.g. 5*789123456789)
  const handleBarcodeSubmit = () => {
    const raw = barcodeInput.trim();
    if (!raw) return;

    let query = raw;
    let multiplier = 1;

    // Parse multiplication: "5*789123456789"
    const multiMatch = raw.match(/^(\d+)\*(.+)$/);
    if (multiMatch) {
      multiplier = Math.max(1, parseInt(multiMatch[1], 10));
      query = multiMatch[2].trim();
    }

    // Scale barcode
    if (isScaleBarcode(query)) {
      pdv.handleBarcodeScan(query);
      playAddSound();
      setBarcodeInput("");
      return;
    }

    // Exact match
    const exactMatch = pdv.products.find(
      (p) => p.sku === query || p.barcode === query || p.id === query || p.ncm === query
    );
    if (exactMatch) {
      if (exactMatch.stock_quantity <= 0) {
        playErrorSound();
        setZeroStockProduct(exactMatch);
        setBarcodeInput("");
        return;
      }
      for (let i = 0; i < multiplier; i++) pdv.addToCart(exactMatch);
      playAddSound();
      toast.success(`${exactMatch.name}${multiplier > 1 ? ` x${multiplier}` : ""} adicionado`);
      setBarcodeInput("");
      return;
    }

    // Partial search
    const searchMatch = pdv.products.find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        (p.ncm && p.ncm.includes(query))
    );
    if (searchMatch) {
      if (searchMatch.stock_quantity <= 0) {
        playErrorSound();
        setZeroStockProduct(searchMatch);
        setBarcodeInput("");
        return;
      }
      for (let i = 0; i < multiplier; i++) pdv.addToCart(searchMatch);
      playAddSound();
      toast.success(`${searchMatch.name}${multiplier > 1 ? ` x${multiplier}` : ""} adicionado`);
    } else {
      playErrorSound();
      toast.error(`Produto não encontrado: ${query}`, {
        action: {
          label: "Cadastrar",
          onClick: () => { setQuickProductBarcode(query); setShowQuickProduct(true); },
        },
      });
    }
    setBarcodeInput("");
  };

  const handleAddToCart = useCallback((product: PDVProduct) => {
    if (product.stock_quantity <= 0) {
      playErrorSound();
      setZeroStockProduct(product);
      return;
    }
    const added = pdv.addToCart(product);
    if (added) {
      playAddSound();
      toast.success(`${product.name} adicionado`);
    }
  }, [pdv]);

  // Keyboard shortcuts — work everywhere including from barcode input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Allow F-keys from any element (including input)
      const isFKey = e.key.startsWith("F") && e.key.length <= 3;
      const isDelete = e.key === "Delete";
      const isEscape = e.key === "Escape";
      
      if (!isFKey && !isDelete && !isEscape) return;

      // Don't intercept in modals (TEF handles its own keys)
      if (showTEF) return;

      if (receipt) {
        if (isEscape) { e.preventDefault(); setReceipt(null); }
        return;
      }
      if (showCashRegister) {
        if (isEscape) { e.preventDefault(); setShowCashRegister(false); }
        return;
      }

      switch (e.key) {
        case "F1": e.preventDefault(); break;
        case "F2": e.preventDefault(); handleCheckout(); break;
        case "F3": e.preventDefault(); setShowProductList((p) => !p); break;
        case "F4": e.preventDefault(); openCashDrawer(); toast.info("Sangria/Gaveta aberta"); break;
        case "F5": e.preventDefault(); setShowLoyaltyClientSelector(true); break;
        case "F6":
          e.preventDefault();
          if (pdv.cartItems.length > 0) { pdv.clearCart(); setSelectedClient(null); toast.info("Venda limpa"); }
          break;
        case "F7":
          e.preventDefault();
          if (pdv.cartItems.length > 0) {
            const lastItem = pdv.cartItems[pdv.cartItems.length - 1];
            setEditingItemDiscountId(lastItem.id);
          }
          break;
        case "F8": e.preventDefault(); setEditingGlobalDiscount(true); break;
        case "F9":
          e.preventDefault();
          if (pdv.cartItems.length > 0) {
            const lastItem = pdv.cartItems[pdv.cartItems.length - 1];
            setEditingQtyItemId(lastItem.id);
            setEditingQtyValue(String(lastItem.quantity));
          }
          break;
        case "F10": e.preventDefault(); setShowPriceLookup(true); setPriceLookupQuery(""); break;
        case "F11": e.preventDefault(); pdv.repeatLastSale(); break;
        case "F12": e.preventDefault(); handleCheckout(); break;
        case "Delete":
          e.preventDefault();
          if (pdv.cartItems.length > 0) {
            const last = pdv.cartItems[pdv.cartItems.length - 1];
            pdv.removeItem(last.id);
            toast.info(`${last.name} removido`);
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopImmediatePropagation();
          // Re-enter fullscreen if browser exited it due to ESC
          if (isFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
          if (showShortcuts) setShowShortcuts(false);
          else if (showPriceLookup) setShowPriceLookup(false);
          else if (showProductList) setShowProductList(false);
          else if (editingQtyItemId) setEditingQtyItemId(null);
          else if (editingItemDiscountId) setEditingItemDiscountId(null);
          else if (editingGlobalDiscount) setEditingGlobalDiscount(false);
          else if (pdv.cartItems.length > 0) {
            pdv.clearCart(); setSelectedClient(null); toast.info("Venda cancelada");
          }
          break;
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [showTEF, receipt, showCashRegister, showShortcuts, showPriceLookup, showProductList, handleCheckout, pdv, editingQtyItemId, editingItemDiscountId, editingGlobalDiscount, isFullscreen]);

  const checkLowStockAfterSale = useCallback((soldItems: typeof pdv.cartItems) => {
    const lowStockItems: string[] = [];
    for (const item of soldItems) {
      const product = pdv.products.find((p) => p.id === item.id);
      if (!product) continue;
      const reorderPoint = product.reorder_point ?? 0;
      if (reorderPoint > 0) {
        const remainingStock = product.stock_quantity - item.quantity;
        if (remainingStock <= reorderPoint) {
          lowStockItems.push(`${product.name} (${remainingStock} ${product.unit})`);
        }
      }
    }
    if (lowStockItems.length > 0) {
      toast.warning(`⚠️ Estoque baixo:\n${lowStockItems.join(", ")}`, { duration: 6000 });
    }
  }, [pdv.products]);

  const handleTEFComplete = async (tefResults: TEFResult[]) => {
    const allApproved = tefResults.every((r) => r.approved);
    if (allApproved) {
      try {
        const paymentResults: PaymentResult[] = tefResults.map((r) => ({
          method: r.method as PaymentResult["method"],
          approved: r.approved, amount: r.amount, nsu: r.nsu,
          auth_code: r.authCode, card_brand: r.cardBrand,
          card_last_digits: r.cardLastDigits, installments: r.installments,
          change_amount: r.changeAmount, pix_tx_id: r.pixTxId,
        }));
        const savedItems = [...pdv.cartItems];
        const savedTotal = pdv.total;
        const savedClient = selectedClient;
        const result = await pdv.finalizeSale(paymentResults);
        playSaleCompleteSound();
        setReceipt({
          items: savedItems, total: savedTotal,
          payments: tefResults, nfceNumber: result.nfceNumber,
        });
        setSelectedClient(null);
        // Increment sale number
        const newNum = saleNumber + 1;
        setSaleNumber(newNum);
        localStorage.setItem("pdv_sale_number", String(newNum));
        checkLowStockAfterSale(savedItems);
        if (loyaltyActive && savedClient?.id) {
          const pts = await earnPoints(savedClient.id, savedTotal, result.fiscalDocId);
          if (pts > 0) toast.info(`🎁 ${savedClient.name} ganhou ${pts} pontos de fidelidade!`);
        }
      } catch (err: any) {
        playErrorSound();
        toast.error(`Erro ao finalizar venda: ${err.message}`);
      }
    }
    setShowTEF(false);
    setTefDefaultMethod(null);
  };

  const handlePrazoRequested = () => {
    setShowTEF(false);
    setTefDefaultMethod(null);
    setShowClientSelector(true);
  };

  const handleCreditSaleConfirmed = async (client: CreditClient, mode: "fiado" | "parcelado", installments: number) => {
    setShowClientSelector(false);
    try {
      const paymentResults: PaymentResult[] = [{
        method: "prazo", approved: true, amount: pdv.total,
        credit_client_id: client.id, credit_client_name: client.name,
        credit_mode: mode, credit_installments: installments,
      }];
      const savedItems = [...pdv.cartItems];
      const savedTotal = pdv.total;
      const result = await pdv.finalizeSale(paymentResults);
      playSaleCompleteSound();
      setReceipt({
        items: savedItems, total: savedTotal,
        payments: [{ method: "prazo" as any, approved: true, amount: savedTotal }],
        nfceNumber: result.nfceNumber,
      });
      toast.success(`Venda a prazo registrada para ${client.name}`);
      setSelectedClient(null);
      const newNum = saleNumber + 1;
      setSaleNumber(newNum);
      localStorage.setItem("pdv_sale_number", String(newNum));
      checkLowStockAfterSale(savedItems);
      if (loyaltyActive && client.id) {
        const pts = await earnPoints(client.id, savedTotal, result.fiscalDocId);
        if (pts > 0) toast.info(`🎁 ${client.name} ganhou ${pts} pontos de fidelidade!`);
      }
    } catch (err: any) {
      playErrorSound();
      toast.error(`Erro ao finalizar venda a prazo: ${err.message}`);
    }
  };

  const totalItems = pdv.cartItems.length;
  const totalQty = pdv.cartItems.reduce((a, i) => a + i.quantity, 0);
  const totalFinal = pdv.total;

  return (
    <div className={`pdv-theme flex flex-col h-screen bg-background text-foreground overflow-hidden select-none ${pdv.trainingMode ? "ring-4 ring-warning/60 ring-inset" : ""}`}>

      {/* ════════ TOP BAR ════════ */}
      <div className="flex items-center justify-between px-3 h-9 bg-primary text-primary-foreground flex-shrink-0 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="font-bold opacity-80 hover:opacity-100 transition-opacity"
          >
            ← Sair
          </button>
          <span className="opacity-60">|</span>
          <span className="font-bold">{companyName || "PDV"}</span>
          <span className="opacity-60">|</span>
          <button
            onClick={() => { setTempTerminalId(terminalId); setShowTerminalPicker(true); }}
            className="font-mono font-bold hover:underline"
          >
            Caixa: T{terminalId}
          </button>
          <span className="opacity-60">|</span>
          <span className="font-mono">Venda #{String(saleNumber).padStart(6, "0")}</span>
          <span className="opacity-60">|</span>
          <span className="font-mono">{new Date().toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="flex items-center gap-4">
          {pdv.trainingMode && (
            <span className="font-bold text-warning animate-pulse">🎓 TREINAMENTO</span>
          )}
          {selectedClient && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="font-bold truncate max-w-[120px]">{selectedClient.name}</span>
              <button onClick={() => setSelectedClient(null)} className="ml-0.5 hover:text-destructive">✕</button>
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="opacity-80 hover:opacity-100 transition-opacity"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
          <span className="flex items-center gap-1">
            {pdv.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="font-bold">{pdv.isOnline ? "Online" : "Offline"}</span>
          </span>
          <LiveClock />
        </div>
      </div>

      {/* ════════ BARCODE INPUT - LARGEST ELEMENT ════════ */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b-2 border-primary flex-shrink-0">
        <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">CÓDIGO:</span>
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
          placeholder="Leia ou digite o código de barras... (ex: 5*789123 para multiplicar)"
          className="flex-1 px-4 py-3 rounded-lg bg-background border-2 border-border text-foreground text-xl font-mono font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50 placeholder:text-sm placeholder:font-normal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* ════════ MAIN CONTENT: 70% items | 30% totals ════════ */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT: Items Table (70%) */}
        <div className="flex-[7] flex flex-col min-w-0 border-r border-border">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr className="text-muted-foreground text-left uppercase tracking-wider">
                  <th className="px-2 py-2 font-bold w-10 text-center">#</th>
                  <th className="px-2 py-2 font-bold w-28">Código</th>
                  <th className="px-2 py-2 font-bold">Descrição</th>
                  <th className="px-2 py-2 font-bold text-center w-24">Qtd</th>
                  <th className="px-2 py-2 font-bold text-right w-24">Unitário</th>
                  <th className="px-2 py-2 font-bold text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pdv.cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-0">
                      <div className="flex flex-col items-center justify-center py-12 gap-5 animate-fade-in">
                        {logoUrl ? (
                          <img src={logoUrl} alt={companyName || "Logo"} className="h-44 object-contain" />
                        ) : (
                          <img src="/logo-as.png" alt="AnthoSystem" className="h-36 object-contain opacity-70" />
                        )}
                        {companyName && (
                          <span className="text-lg font-bold text-foreground/60">{companyName}</span>
                        )}
                        {slogan && (
                          <span className="text-sm text-muted-foreground italic">{slogan}</span>
                        )}
                        <span className="text-xs text-muted-foreground/50 mt-2">Aguardando leitura de código de barras...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pdv.cartItems.map((item, idx) => {
                    const isLast = idx === pdv.cartItems.length - 1;
                    const itemDiscount = pdv.itemDiscounts[item.id] || 0;
                    const unitPrice = item.price * (1 - itemDiscount / 100);
                    const subtotalItem = unitPrice * item.quantity;
                    const isWeighed = !Number.isInteger(item.quantity);

                    return (
                      <tr
                        key={item.id}
                        ref={isLast ? tableEndRef : undefined}
                        className={`border-b border-border transition-colors ${
                          flashItemId === item.id
                            ? "animate-pdv-flash"
                            : isLast
                            ? "bg-primary/10 font-bold"
                            : idx % 2 === 0
                            ? "bg-card"
                            : "bg-muted/30"
                        }`}
                      >
                        <td className="px-2 py-2 text-center text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="px-2 py-2 font-mono text-muted-foreground">{item.sku}</td>
                        <td className="px-2 py-2 text-foreground">
                          {item.name}
                          {isWeighed && (
                            <span className="ml-1.5 text-[10px] text-primary font-bold">
                              {item.quantity.toFixed(3)}kg × {formatCurrency(item.price)}
                            </span>
                          )}
                          {itemDiscount > 0 && (
                            <span className="ml-1.5 text-[10px] text-destructive font-bold">-{itemDiscount}%</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center font-mono font-bold text-foreground">
                          {isWeighed ? item.quantity.toFixed(3) : item.quantity}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-muted-foreground">
                          {itemDiscount > 0 && (
                            <span className="line-through opacity-50 mr-1">{formatCurrency(item.price)}</span>
                          )}
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono font-bold text-primary text-sm">
                          {formatCurrency(subtotalItem)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Totals Sidebar (30%) */}
        <div className="flex-[3] flex flex-col bg-card min-w-[260px] max-w-[400px]">
          {/* Info rows */}
          <div className="flex-1 flex flex-col p-4 gap-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">Itens</span>
              <span className="text-lg font-bold text-foreground font-mono">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">Qtd Total</span>
              <span className="text-lg font-bold text-foreground font-mono">
                {Number.isInteger(totalQty) ? totalQty : totalQty.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">Subtotal</span>
              <span className="text-lg font-bold text-foreground font-mono">{formatCurrency(pdv.subtotal)}</span>
            </div>

            {/* Desconto item (F7) */}
            {editingItemDiscountId && (
              <div className="flex justify-between items-center py-2 border-b border-border bg-muted/50 rounded px-2 -mx-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Desc. Item (F7)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={maxDiscountPercent}
                    step={0.5}
                    autoFocus
                    defaultValue={pdv.itemDiscounts[editingItemDiscountId] || 0}
                    onBlur={(e) => {
                      const val = Math.min(Math.max(0, Number(e.target.value)), maxDiscountPercent);
                      pdv.setItemDiscount(editingItemDiscountId!, val);
                      setEditingItemDiscountId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = Math.min(Math.max(0, Number((e.target as HTMLInputElement).value)), maxDiscountPercent);
                        pdv.setItemDiscount(editingItemDiscountId!, val);
                        setEditingItemDiscountId(null);
                      }
                      if (e.key === "Escape") setEditingItemDiscountId(null);
                    }}
                    className="w-16 px-2 py-1 rounded bg-background border border-border text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {/* Desconto global (F8) */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase">Desconto</span>
              {editingGlobalDiscount ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={maxDiscountPercent}
                    step={0.5}
                    autoFocus
                    defaultValue={pdv.globalDiscountPercent}
                    onBlur={(e) => {
                      const val = Math.min(Math.max(0, Number(e.target.value)), maxDiscountPercent);
                      pdv.setGlobalDiscountPercent(val);
                      setEditingGlobalDiscount(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = Math.min(Math.max(0, Number((e.target as HTMLInputElement).value)), maxDiscountPercent);
                        pdv.setGlobalDiscountPercent(val);
                        setEditingGlobalDiscount(false);
                      }
                      if (e.key === "Escape") setEditingGlobalDiscount(false);
                    }}
                    className="w-16 px-2 py-1 rounded bg-background border border-border text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              ) : (
                <button
                  onClick={() => maxDiscountPercent > 0 && setEditingGlobalDiscount(true)}
                  className={`text-lg font-bold font-mono ${pdv.globalDiscountPercent > 0 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {pdv.globalDiscountPercent > 0 ? `-${formatCurrency(pdv.globalDiscountValue)}` : "R$ 0,00"}
                </button>
              )}
            </div>

            {/* Economia promoções */}
            {pdv.promoSavings > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-xs font-bold text-primary uppercase">Economia</span>
                <span className="text-lg font-bold text-primary font-mono">-{formatCurrency(pdv.promoSavings)}</span>
              </div>
            )}

            {/* Alterar Quantidade (F9) */}
            {editingQtyItemId && (
              <div className="flex justify-between items-center py-2 border-b border-border bg-muted/50 rounded px-2 -mx-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Nova Qtd (F9)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    autoFocus
                    value={editingQtyValue}
                    onChange={(e) => setEditingQtyValue(e.target.value)}
                    onBlur={() => {
                      const newQty = Math.max(1, parseInt(editingQtyValue) || 1);
                      const item = pdv.cartItems.find(i => i.id === editingQtyItemId);
                      if (item) {
                        const delta = newQty - item.quantity;
                        pdv.updateQuantity(editingQtyItemId!, delta);
                      }
                      setEditingQtyItemId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const newQty = Math.max(1, parseInt(editingQtyValue) || 1);
                        const item = pdv.cartItems.find(i => i.id === editingQtyItemId);
                        if (item) {
                          const delta = newQty - item.quantity;
                          pdv.updateQuantity(editingQtyItemId!, delta);
                        }
                        setEditingQtyItemId(null);
                      }
                      if (e.key === "Escape") setEditingQtyItemId(null);
                    }}
                    className="w-16 px-2 py-1 rounded bg-background border border-border text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TOTAL — BIG DISPLAY */}
          <div
            className="p-6 mt-auto border-t-4 transition-colors duration-300"
            style={{
              backgroundColor: totalFinal > 0 ? "hsl(0, 72%, 40%)" : "hsl(142, 72%, 32%)",
              borderTopColor: totalFinal > 0 ? "hsl(0, 72%, 50%)" : "hsl(142, 72%, 45%)",
            }}
          >
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-[0.25em] block mb-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                {totalFinal > 0 ? "TOTAL A PAGAR" : "TOTAL DA VENDA"}
              </span>
              <span className="text-7xl font-black font-mono tracking-tight block" style={{ color: "#ffffff", textShadow: "0 3px 12px rgba(0,0,0,0.4)" }}>
                {formatCurrency(totalFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ BOTTOM PAYMENT BAR ════════ */}
      <div className="flex flex-col flex-shrink-0 border-t-2 border-border bg-card">
        {/* Payment method buttons */}
        <div className="flex items-stretch gap-1.5 px-3 py-2">
          {[
            { id: "dinheiro", label: "Dinheiro", icon: Banknote, shortcut: "F2", colorClass: "bg-emerald-600 hover:bg-emerald-700 text-white" },
            { id: "debito", label: "Débito", icon: CreditCard, shortcut: "", colorClass: "bg-blue-600 hover:bg-blue-700 text-white" },
            { id: "credito", label: "Crédito", icon: CreditCard, shortcut: "", colorClass: "bg-purple-600 hover:bg-purple-700 text-white" },
            { id: "pix", label: "PIX", icon: QrCode, shortcut: "", colorClass: "bg-teal-600 hover:bg-teal-700 text-white" },
            { id: "voucher", label: "Voucher", icon: Ticket, shortcut: "", colorClass: "bg-amber-600 hover:bg-amber-700 text-white" },
            { id: "prazo", label: "A Prazo", icon: ClockIcon, shortcut: "", colorClass: "bg-orange-600 hover:bg-orange-700 text-white" },
            { id: "outros", label: "Outros", icon: MoreHorizontal, shortcut: "", colorClass: "bg-secondary hover:bg-secondary/80 text-secondary-foreground" },
          ].map(({ id, label, icon: Icon, shortcut, colorClass }) => (
            <button
              key={id}
              onClick={() => handleDirectPayment(id)}
              disabled={pdv.cartItems.length === 0}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${colorClass}`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {/* Shortcut hints row */}
        <div className="flex items-center justify-center gap-3 px-3 py-1 bg-muted/50 border-t border-border text-[10px]">
          {[
            { key: "F3", label: "Buscar" },
            { key: "F5", label: "Cliente" },
            { key: "F6", label: "Limpar" },
            { key: "F7", label: "Desc.Item" },
            { key: "F8", label: "Desc.Total" },
            { key: "F9", label: "Qtd" },
            { key: "DEL", label: "Remover" },
            { key: "ESC", label: "Cancelar" },
          ].map(({ key, label }) => (
            <span key={key} className="flex items-center gap-0.5 text-muted-foreground">
              <span className="font-mono font-black bg-muted px-1 py-0.5 rounded text-[9px]">{key}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ════════ OVERLAYS ════════ */}

      {/* Product List Overlay */}
      {showProductList && (
        <div className="absolute inset-0 z-30 bg-background flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted flex-shrink-0">
            <span className="text-xs font-bold text-muted-foreground uppercase">Buscar Produtos (F3)</span>
            <button
              onClick={() => setShowProductList(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              <X className="w-3 h-3" /> Fechar (Esc)
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <PDVProductGrid
              products={pdv.products}
              loading={pdv.loadingProducts}
              companyName={companyName}
              logoUrl={logoUrl}
              onAddToCart={(product) => {
                handleAddToCart(product);
                setShowProductList(false);
              }}
            />
          </div>
        </div>
      )}

      {/* TEF */}
      {showTEF && (
        <TEFProcessor total={pdv.total} onComplete={handleTEFComplete} onCancel={() => { setShowTEF(false); setTefDefaultMethod(null); }} onPrazoRequested={handlePrazoRequested} defaultMethod={tefDefaultMethod as any} pixConfig={pixKey ? { pixKey, pixKeyType: pixKeyType || undefined, merchantName: companyName || "LOJA", merchantCity: pixCity || "SAO PAULO" } : null} tefConfig={tefConfigData ? { provider: tefConfigData.provider, apiKey: tefConfigData.api_key, apiSecret: tefConfigData.api_secret, terminalId: tefConfigData.terminal_id, merchantId: tefConfigData.merchant_id, companyId: companyId || undefined, environment: tefConfigData.environment } : null} />
      )}

      {/* Client selector for credit sales */}
      {showClientSelector && (
        <PDVClientSelector open={showClientSelector} onClose={() => setShowClientSelector(false)} onSelect={handleCreditSaleConfirmed} saleTotal={pdv.total} />
      )}

      {/* Loyalty client selector */}
      {showLoyaltyClientSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowLoyaltyClientSelector(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Identificar Cliente {loyaltyActive && "🎁"}</h2>
              <button onClick={() => setShowLoyaltyClientSelector(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <PDVLoyaltyClientList
              onSelect={(client) => {
                setSelectedClient(client);
                setShowLoyaltyClientSelector(false);
                toast.success(`Cliente: ${client.name}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Receive credit dialog */}
      {showReceiveCredit && (
        <PDVReceiveCreditDialog open={showReceiveCredit} onClose={() => setShowReceiveCredit(false)} />
      )}

      {/* Receipt */}
      {receipt && (
        <SaleReceipt
          items={receipt.items.map((i) => ({
            id: i.id, name: i.name, price: i.price, category: i.category || "",
            sku: i.sku, ncm: i.ncm || "", unit: i.unit, stock: i.stock_quantity, quantity: i.quantity,
          }))}
          total={receipt.total} payments={receipt.payments} nfceNumber={receipt.nfceNumber}
          slogan={slogan || undefined} logoUrl={logoUrl || undefined} companyName={companyName || undefined}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* Cash Register */}
      {showCashRegister && (
        <CashRegister
          terminalId={terminalId}
          onClose={() => { setShowCashRegister(false); pdv.reloadSession(terminalId); }}
        />
      )}

      {/* Zero stock dialog */}
      {zeroStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setZeroStockProduct(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <PackageX className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Produto sem Estoque</h2>
              <p className="text-sm text-muted-foreground"><strong>{zeroStockProduct.name}</strong> está com estoque zerado.</p>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setZeroStockProduct(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted">Fechar</button>
                <button onClick={() => { setStockMovementProduct(zeroStockProduct); setZeroStockProduct(null); }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Adicionar Estoque</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock movement dialog from PDV */}
      {stockMovementProduct && (
        <StockMovementDialog
          open={!!stockMovementProduct}
          onOpenChange={(v) => { if (!v) { setStockMovementProduct(null); pdv.refreshProducts(); } }}
          product={{
            ...stockMovementProduct, id: stockMovementProduct.id, name: stockMovementProduct.name,
            sku: stockMovementProduct.sku, unit: stockMovementProduct.unit,
            stock_quantity: stockMovementProduct.stock_quantity, price: stockMovementProduct.price,
            is_active: 1, created_at: "", updated_at: "", company_id: "",
            ncm: stockMovementProduct.ncm, category: stockMovementProduct.category,
            barcode: stockMovementProduct.barcode, cost_price: null, min_stock: null,
            origem: 0, cfop: "5102", cest: null, csosn: "102", cst_icms: "00",
            aliq_icms: 0, cst_pis: "01", aliq_pis: 1.65, cst_cofins: "01",
            aliq_cofins: 7.60, gtin_tributavel: null, fiscal_category_id: null,
          }}
        />
      )}

      {/* Quick product registration */}
      <PDVQuickProductDialog open={showQuickProduct} onOpenChange={setShowQuickProduct} initialBarcode={quickProductBarcode} onProductCreated={() => pdv.refreshProducts()} />

      {/* Price Lookup Dialog (F10) */}
      {showPriceLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPriceLookup(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Consulta de Preço (F10)
              </h2>
              <button onClick={() => setShowPriceLookup(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text" value={priceLookupQuery} onChange={(e) => setPriceLookupQuery(e.target.value)}
                placeholder="Digite código, SKU ou nome..." autoFocus
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
                        <p className="text-lg font-black text-primary font-mono">{formatCurrency(p.price)}</p>
                        <p className={`text-xs font-mono ${p.stock_quantity > 0 ? "text-primary" : "text-destructive"}`}>
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
                  <p className="text-center text-sm text-muted-foreground py-8">Digite ao menos 2 caracteres</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Quote Dialog */}
      {showSaveQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSaveQuote(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Salvar Orçamento</h2>
              <button onClick={() => setShowSaveQuote(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{pdv.cartItems.length} item(ns)</p>
                <p className="text-2xl font-black font-mono text-primary">{formatCurrency(pdv.total)}</p>
              </div>
              {selectedClient && <div className="text-sm text-foreground">Cliente: <strong>{selectedClient.name}</strong></div>}
              <div>
                <label className="text-xs text-muted-foreground font-medium">Observações (opcional)</label>
                <textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} rows={3}
                  placeholder="Ex: Validade 30 dias..."
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSaveQuote(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted">Cancelar</button>
                <button onClick={handleSaveQuote} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Picker Modal */}
      {showTerminalPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTerminalPicker(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Monitor className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Selecionar Terminal</h3>
                <p className="text-xs text-muted-foreground">Identificação deste caixa</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["01", "02", "03", "04", "05", "06", "07", "08"].map((tid) => (
                <button key={tid} onClick={() => setTempTerminalId(tid)}
                  className={`py-3 rounded-xl text-sm font-bold font-mono transition-all ${tempTerminalId === tid ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"}`}
                >T{tid}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowTerminalPicker(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">Cancelar</button>
              <button onClick={() => {
                const newId = tempTerminalId || "01";
                setTerminalId(newId);
                localStorage.setItem("pdv_terminal_id", newId);
                setShowTerminalPicker(false);
                toast.success(`Terminal: T${newId}`);
              }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/** Simple live clock component for the top bar */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="font-mono font-bold tracking-wider">
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}
