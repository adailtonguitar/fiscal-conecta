import { useState, useCallback } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { SaleReceipt } from "@/components/pos/SaleReceipt";
import { type Product, type CartItem } from "@/lib/mock-data";
import { AnimatePresence } from "framer-motion";

export default function PDV() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [receipt, setReceipt] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    nfceNumber: string;
  } | null>(null);

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

  const finishSale = useCallback(
    (method: string) => {
      const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const nfceNumber = String(Math.floor(Math.random() * 999999)).padStart(6, "0");
      setReceipt({ items: [...cartItems], total, paymentMethod: method, nfceNumber });
      setCartItems([]);
    },
    [cartItems]
  );

  return (
    <div className="flex h-full pos-screen">
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
          onFinishSale={finishSale}
        />
      </div>

      {/* Receipt overlay */}
      <AnimatePresence>
        {receipt && (
          <SaleReceipt
            items={receipt.items}
            total={receipt.total}
            paymentMethod={receipt.paymentMethod}
            nfceNumber={receipt.nfceNumber}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
