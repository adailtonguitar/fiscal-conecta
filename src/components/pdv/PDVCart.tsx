import { Trash2, ShoppingCart, Percent, Tag } from "lucide-react";
import type { AppliedPromo } from "@/services/PromotionEngine";
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
  companyName?: string | null;
  logoUrl?: string | null;
  // Discount props
  maxDiscountPercent: number;
  itemDiscounts: Record<string, number>;
  onSetItemDiscount: (productId: string, percent: number) => void;
  globalDiscountPercent: number;
  onSetGlobalDiscount: (percent: number) => void;
  subtotal: number;
  globalDiscountValue: number;
  appliedPromos?: AppliedPromo[];
  promoSavings?: number;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-3xl font-bold font-mono text-sidebar-foreground tracking-wider">
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function PDVCart({ items, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout, selectedItemId, onSelectItem, companyName, logoUrl, maxDiscountPercent, itemDiscounts, onSetItemDiscount, globalDiscountPercent, onSetGlobalDiscount, subtotal, globalDiscountValue, appliedPromos = [], promoSavings = 0 }: PDVCartProps) {
  const totalFinal = Math.max(0, subtotal - globalDiscountValue - promoSavings);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const selectedItem = selectedItemId ? items.find((i) => i.id === selectedItemId) || null : (items.length > 0 ? items[items.length - 1] : null);
  const [editingItemDiscount, setEditingItemDiscount] = useState<string | null>(null);
  const [editingGlobalDiscount, setEditingGlobalDiscount] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Top info bar: date + clock */}
      <div className="flex items-center justify-between px-4 py-2 bg-sidebar-background border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Itens:</span>
            <span className="text-sm font-bold text-sidebar-foreground font-mono">{items.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Qtd Total:</span>
            <span className="text-sm font-bold text-sidebar-foreground font-mono">{totalQuantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Data:</span>
            <span className="text-sm font-bold text-sidebar-foreground font-mono">
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
        <div className="w-[280px] flex-shrink-0 border-r border-border bg-card p-4 flex flex-col gap-3">
          {selectedItem ? (
            <>
              {/* Product image */}
              <div className="w-full aspect-square rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden border border-border">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : logoUrl ? (
                  <img src={logoUrl} alt={companyName || "Logo"} className="max-h-20 max-w-full object-contain opacity-60" />
                ) : (
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
                )}
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
                {/* Item discount */}
                <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Desconto:</span>
                  {editingItemDiscount === selectedItem.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={maxDiscountPercent}
                        step={0.5}
                        defaultValue={itemDiscounts[selectedItem.id] || 0}
                        autoFocus
                        onBlur={(e) => {
                          const val = Math.min(Math.max(0, Number(e.target.value)), maxDiscountPercent);
                          onSetItemDiscount(selectedItem.id, val);
                          setEditingItemDiscount(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = Math.min(Math.max(0, Number((e.target as HTMLInputElement).value)), maxDiscountPercent);
                            onSetItemDiscount(selectedItem.id, val);
                            setEditingItemDiscount(null);
                          }
                          if (e.key === "Escape") setEditingItemDiscount(null);
                        }}
                        className="w-16 px-1.5 py-0.5 rounded bg-muted border border-border text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => maxDiscountPercent > 0 && setEditingItemDiscount(selectedItem.id)}
                      className={`text-sm font-bold font-mono ${(itemDiscounts[selectedItem.id] || 0) > 0 ? "text-destructive" : "text-muted-foreground"} hover:text-primary transition-colors`}
                      title={maxDiscountPercent > 0 ? `Máx: ${maxDiscountPercent}%` : "Sem permissão para desconto"}
                    >
                      {(itemDiscounts[selectedItem.id] || 0) > 0 ? `${itemDiscounts[selectedItem.id]}%` : "0%"}
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Subtotal:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(selectedItem.price * (1 - (itemDiscounts[selectedItem.id] || 0) / 100) * selectedItem.quantity)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName || "Logo"} className="max-h-32 max-w-full object-contain opacity-90" />
                ) : (
                  <ShoppingCart className="w-16 h-16" />
                )}
                <span className="text-sm font-semibold text-center">
                  {companyName || "Aguardando produto..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Items table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-sidebar-background z-10">
                <tr className="text-sidebar-foreground text-left">
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
                        <td className="px-3 py-2 text-foreground font-medium">
                          <span>{item.name}</span>
                          {appliedPromos.find((p) => p.productId === item.id) && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">
                              <Tag className="w-2.5 h-2.5" />
                              {appliedPromos.find((p) => p.productId === item.id)!.promotionName}
                            </span>
                          )}
                        </td>
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
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {(itemDiscounts[item.id] || 0) > 0 ? (
                            <span className="line-through text-muted-foreground/50 mr-1">{formatCurrency(item.price)}</span>
                          ) : null}
                          {formatCurrency(item.price * (1 - (itemDiscounts[item.id] || 0) / 100))}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-primary">
                          {formatCurrency(item.price * (1 - (itemDiscounts[item.id] || 0) / 100) * item.quantity)}
                          {(itemDiscounts[item.id] || 0) > 0 && (
                            <span className="text-[9px] text-destructive ml-1">-{itemDiscounts[item.id]}%</span>
                          )}
                        </td>
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
          <div className="border-t-2 border-border bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Itens:</span>
                <span className="text-sm font-bold text-foreground font-mono">{items.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Soma Qtd:</span>
                <span className="text-sm font-bold text-foreground font-mono">{totalQuantity}</span>
              </div>
              {/* Global discount */}
              {maxDiscountPercent > 0 && items.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3 h-3 text-muted-foreground" />
                  {editingGlobalDiscount ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={maxDiscountPercent}
                        step={0.5}
                        defaultValue={globalDiscountPercent}
                        autoFocus
                        onBlur={(e) => {
                          const val = Math.min(Math.max(0, Number(e.target.value)), maxDiscountPercent);
                          onSetGlobalDiscount(val);
                          setEditingGlobalDiscount(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = Math.min(Math.max(0, Number((e.target as HTMLInputElement).value)), maxDiscountPercent);
                            onSetGlobalDiscount(val);
                            setEditingGlobalDiscount(false);
                          }
                          if (e.key === "Escape") setEditingGlobalDiscount(false);
                        }}
                        className="w-14 px-1.5 py-0.5 rounded bg-muted border border-border text-xs font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingGlobalDiscount(true)}
                      className={`text-xs font-bold font-mono ${globalDiscountPercent > 0 ? "text-destructive" : "text-muted-foreground"} hover:text-primary transition-colors`}
                      title={`Desconto geral (máx: ${maxDiscountPercent}%)`}
                    >
                      Desc: {globalDiscountPercent > 0 ? `${globalDiscountPercent}%` : "0%"}
                    </button>
                  )}
                  {globalDiscountValue > 0 && (
                    <span className="text-xs text-destructive font-mono">(-{formatCurrency(globalDiscountValue)})</span>
                  )}
                </div>
              )}
              {promoSavings > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-primary">Promoções: -{formatCurrency(promoSavings)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-muted-foreground uppercase">Total da Compra:</span>
              <motion.span
                key={totalFinal}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-4xl font-black text-primary font-mono"
              >
                {formatCurrency(totalFinal)}
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
