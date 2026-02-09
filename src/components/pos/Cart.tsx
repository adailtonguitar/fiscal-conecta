import { Minus, Plus, Trash2, CreditCard, Banknote, QrCode, X } from "lucide-react";
import { formatCurrency, type CartItem } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onFinishSale: (method: string) => void;
}

const paymentMethods = [
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "pix", label: "PIX", icon: QrCode },
];

export function Cart({ items, onUpdateQuantity, onRemoveItem, onClearCart, onFinishSale }: CartProps) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-pos-surface border-l border-pos-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-pos-border">
        <div>
          <h2 className="text-sm font-semibold text-pos-text">Carrinho</h2>
          <span className="text-xs text-pos-text-muted">{totalItems} itens</span>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="p-1.5 rounded-lg text-pos-text-muted hover:text-destructive hover:bg-pos-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-pos-text-muted">Nenhum item adicionado</p>
            </div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 py-2.5 border-b border-pos-border last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-pos-text truncate">{item.name}</p>
                  <p className="pos-price text-xs mt-0.5">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-md bg-pos-bg flex items-center justify-center text-pos-text-muted hover:text-pos-text transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-mono text-pos-text">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-md bg-pos-bg flex items-center justify-center text-pos-text-muted hover:text-pos-text transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-pos-text-muted hover:text-destructive transition-colors ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Payment */}
      {items.length > 0 && (
        <div className="border-t border-pos-border p-4 space-y-4">
          {/* Total */}
          <div className="flex items-end justify-between">
            <span className="text-sm text-pos-text-muted">Total</span>
            <span className="pos-price text-2xl">{formatCurrency(subtotal)}</span>
          </div>

          {/* Payment methods */}
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => onFinishSale(pm.label)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-bg text-pos-text text-sm font-medium hover:bg-pos-accent hover:text-primary-foreground transition-all active:scale-[0.97]"
              >
                <pm.icon className="w-4 h-4" />
                {pm.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
