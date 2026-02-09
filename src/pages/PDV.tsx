import { useState, useCallback } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { TEFProcessor, type TEFResult } from "@/components/pos/TEFProcessor";
import { CashRegister } from "@/components/pos/CashRegister";
import { type Product, type CartItem, products as allProducts } from "@/lib/mock-data";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AnimatePresence } from "framer-motion";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function PDV() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showTEF, setShowTEF] = useState(false);
  const [showCashRegister, setShowCashRegister] = useState(false);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    nfceNumber: string;
    tefResult?: TEFResult;
  } | null>(null);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Barcode scanner: find product by SKU or barcode
  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = allProducts.find(
      (p) => p.sku === barcode || p.id === barcode
    );
    if (product) {
      addToCart(product);
      toast.success(`${product.name} adicionado`);
    } else {
      toast.error(`Produto não encontrado: ${barcode}`);
    }
  }, []);

  useBarcodeScanner(handleBarcodeScan);

  const addToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const handleCheckout = () => {
    if (cartItems.length > 0) setShowTEF(true);
  };

  const handleTEFComplete = (result: TEFResult) => {
    if (result.approved) {
      const methodLabels: Record<string, string> = {
        dinheiro: "Dinheiro",
        debito: "Cartão Débito",
        credito: "Cartão Crédito",
        pix: "PIX",
      };
      const nfceNumber = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
      setReceipt({
        items: [...cartItems],
        total,
        paymentMethod: methodLabels[result.method] || result.method,
        nfceNumber,
        tefResult: result,
      });
      setCartItems([]);
    }
    setShowTEF(false);
  };

  return (
    <div className="flex h-full pos-screen relative">
      {/* Cash register button */}
      <button
        onClick={() => setShowCashRegister(true)}
        className="absolute top-3 right-[354px] z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-hover transition-all text-xs font-medium"
      >
        <DollarSign className="w-3.5 h-3.5" />
        Caixa
      </button>

      {/* Product area */}
      <div className="flex-1 min-w-0">
        <ProductGrid onAddToCart={addToCart} />
      </div>

      {/* Cart sidebar */}
      <div className="w-[340px] flex-shrink-0">
        <Cart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>

      {/* TEF Processor overlay */}
      <AnimatePresence>
        {showTEF && (
          <TEFProcessor
            total={total}
            onComplete={handleTEFComplete}
            onCancel={() => setShowTEF(false)}
          />
        )}
      </AnimatePresence>

      {/* Receipt overlay */}
      <AnimatePresence>
        {receipt && (
          <SaleReceipt
            items={receipt.items}
            total={receipt.total}
            paymentMethod={receipt.paymentMethod}
            nfceNumber={receipt.nfceNumber}
            tefResult={receipt.tefResult}
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
