import { Trash2, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { PDVCartItem } from "@/hooks/usePDV";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface PDVCartProps {
  items: PDVCartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function PDVCart({ items, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }: PDVCartProps) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Items table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[hsl(220,30%,15%)] z-10">
            <tr className="text-pos-text-muted text-left">
              <th className="px-2 py-1.5 font-medium w-10">#</th>
              <th className="px-2 py-1.5 font-medium">Código</th>
              <th className="px-2 py-1.5 font-medium">Descrição</th>
              <th className="px-2 py-1.5 font-medium">Und</th>
              <th className="px-2 py-1.5 font-medium text-center">Qtd</th>
              <th className="px-2 py-1.5 font-medium text-right">Vlr Unit.</th>
              <th className="px-2 py-1.5 font-medium text-right">Total</th>
              <th className="px-2 py-1.5 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-pos-text-muted text-sm">
                    Nenhum item adicionado
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`${idx % 2 === 0 ? "bg-pos-surface/30" : ""} hover:bg-pos-surface-hover transition-colors`}
                  >
                    <td className="px-2 py-1.5 text-pos-text-muted">{idx + 1}</td>
                    <td className="px-2 py-1.5 font-mono text-pos-text-muted">{item.sku}</td>
                    <td className="px-2 py-1.5 text-pos-text">{item.name}</td>
                    <td className="px-2 py-1.5 text-pos-text-muted">{item.unit}</td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded bg-pos-bg flex items-center justify-center text-pos-text-muted hover:text-pos-text text-[10px] font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-pos-text">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded bg-pos-bg flex items-center justify-center text-pos-text-muted hover:text-pos-text text-[10px] font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right pos-price">{formatCurrency(item.price)}</td>
                    <td className="px-2 py-1.5 text-right pos-price font-bold">{formatCurrency(item.price * item.quantity)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-pos-text-muted hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className="border-t-2 border-pos-accent">
        {/* Subtotal row */}
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(220,30%,15%)]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-pos-accent" />
            <span className="text-xs text-pos-text-muted">{totalItems} itens</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-pos-text-muted uppercase tracking-wider font-medium">Subtotal</span>
            <span className="pos-price text-xl">{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(220,30%,12%)]">
          <div className="flex-1 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-pos-text-muted">TOTAL RECEBIDO:</span>
              <span className="pos-price">{formatCurrency(0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-pos-text-muted">TROCO:</span>
              <span className="pos-price">{formatCurrency(0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClearCart}
                className="px-3 py-2 rounded-lg bg-destructive/20 border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/30 transition-all"
              >
                Limpar (F6)
              </button>
            )}
            <button
              onClick={onCheckout}
              disabled={items.length === 0}
              className="px-6 py-2 rounded-lg bg-pos-accent text-primary-foreground text-xs font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              Pagamento (F2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
