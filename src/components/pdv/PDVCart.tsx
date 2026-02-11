import { Trash2, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { PDVCartItem } from "@/hooks/usePDV";
import { useState, useEffect } from "react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface PDVCartProps {
  items: PDVCartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  selectedItemId?: string | null;
  onSelectItem?: (id: string | null) => void;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-3xl font-bold font-mono text-primary-foreground tracking-wider">
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function PDVCart({ items, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, selectedItemId, onSelectItem }: PDVCartProps) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) || null : (items.length > 0 ? items[items.length - 1] : null);

  return (
    <div className="flex flex-col h-full">
      {/* Top info bar: date + clock */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary border-b border-primary/80">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-foreground/80 uppercase">Itens:</span>
            <span className="text-sm font-bold text-primary-foreground font-mono">{items.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-foreground/80 uppercase">Qtd Total:</span>
            <span className="text-sm font-bold text-primary-foreground font-mono">{totalQuantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary-foreground/80 uppercase">Data:</span>
            <span className="text-sm font-bold text-primary-foreground font-mono">
              {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
        <LiveClock />
      </div>

      {/* Selected product name - big display */}
      <div className="px-4 py-3 bg-card border-b border-border min-h-[56px] flex items-center">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.h2
              key={selectedItem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-black text-card-foreground uppercase tracking-wide truncate"
            >
              {selectedItem.name}
            </motion.h2>
          ) : (
            <motion.h2
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold text-muted-foreground uppercase"
            >
              Aguardando produto...
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      {/* Main content: left product detail + right items table */}
      <div className="flex flex-1 min-h-0 bg-muted">
        {/* LEFT: Selected product detail */}
        <div className="w-[280px] flex-shrink-0 border-r border-border bg-card p-4 flex flex-col gap-4">
          {selectedItem ? (
            <>
              {/* Product image placeholder */}
              <div className="w-full aspect-square rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12" />
                  <span className="text-xs font-medium">Sem imagem</span>
                </div>
              </div>

              {/* Product info fields */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Código:</span>
                  <span className="text-sm font-mono font-bold text-card-foreground">{selectedItem.sku}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Preço:</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(selectedItem.price)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Quantidade:</span>
                  <span className="text-lg font-bold text-card-foreground font-mono">{selectedItem.quantity}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Subtotal:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(selectedItem.price * selectedItem.quantity)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ShoppingCart className="w-16 h-16" />
                <span className="text-sm font-medium">Nenhum produto</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Items table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-primary z-10">
                <tr className="text-primary-foreground text-left">
                  <th className="px-3 py-2 font-bold w-12">Item</th>
                  <th className="px-3 py-2 font-bold">Código</th>
                  <th className="px-3 py-2 font-bold">Descrição</th>
                  <th className="px-3 py-2 font-bold text-center">Quantidade</th>
                  <th className="px-3 py-2 font-bold text-right">Preço</th>
                  <th className="px-3 py-2 font-bold text-right">Subtotal</th>
                  <th className="px-3 py-2 font-bold w-8"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">
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
                        onClick={() => onSelectItem?.(item.id)}
                        className={`cursor-pointer transition-colors border-b border-border ${
                          selectedItemId === item.id
                            ? "bg-accent ring-1 ring-primary/40"
                            : idx % 2 === 0 ? "bg-card" : "bg-muted/50"
                        } hover:bg-accent/50`}
                      >
                        <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{item.sku}</td>
                        <td className="px-3 py-2 text-foreground font-medium">{item.name}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {Number.isInteger(item.quantity) ? (
                              <>
                                <button
                                  onClick={() => onUpdateQuantity(item.id, -1)}
                                  className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:bg-border text-[10px] font-bold transition-colors"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-mono font-bold text-foreground">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.id, 1)}
                                  className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:bg-border text-[10px] font-bold transition-colors"
                                >
                                  +
                                </button>
                              </>
                            ) : (
                              <span className="font-mono font-bold text-foreground">{item.quantity.toFixed(3)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">{formatCurrency(item.price)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Total bar at bottom of table */}
          <div className="border-t-2 border-primary bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Itens:</span>
                <span className="text-sm font-bold text-foreground font-mono">{items.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Soma Qtd:</span>
                <span className="text-sm font-bold text-foreground font-mono">{totalQuantity}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-muted-foreground uppercase">Total da Compra:</span>
              <motion.span
                key={subtotal}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-primary font-mono"
              >
                {formatCurrency(subtotal)}
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-sidebar-background border-t border-border">
        <div className="flex-1" />
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
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            Pagamento (F2)
          </button>
        </div>
      </div>
    </div>
  );
}
