import { Check, Printer, X } from "lucide-react";
import { formatCurrency, type CartItem } from "@/lib/mock-data";
import { motion } from "framer-motion";

interface SaleReceiptProps {
  items: CartItem[];
  total: number;
  paymentMethod: string;
  nfceNumber: string;
  onClose: () => void;
}

export function SaleReceipt({ items, total, paymentMethod, nfceNumber, onClose }: SaleReceiptProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-pos-bg/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-pos-surface border border-pos-border rounded-2xl w-full max-w-sm mx-4 overflow-hidden"
      >
        {/* Success header */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-bold text-pos-text">Venda Finalizada!</h3>
          <p className="text-sm text-pos-text-muted mt-1">NFC-e #{nfceNumber}</p>
        </div>

        {/* Items summary */}
        <div className="px-6 py-3 border-t border-pos-border max-h-48 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-1.5 text-sm">
              <span className="text-pos-text-muted">
                {item.quantity}× {item.name}
              </span>
              <span className="font-mono text-pos-text">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="px-6 py-4 border-t border-pos-border">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-pos-text-muted">Pagamento</p>
              <p className="text-sm text-pos-text font-medium">{paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-pos-text-muted">Total</p>
              <p className="pos-price text-xl">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-pos-border">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-bg text-pos-text-muted text-sm font-medium hover:bg-pos-surface-hover transition-all"
          >
            <X className="w-4 h-4" />
            Fechar
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
