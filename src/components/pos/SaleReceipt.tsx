import { Check, Printer, X } from "lucide-react";
import { formatCurrency, type CartItem } from "@/lib/mock-data";
import { type TEFResult } from "@/components/pos/TEFProcessor";
import { motion } from "framer-motion";

const methodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão Débito",
  credito: "Cartão Crédito",
  pix: "PIX",
  voucher: "Voucher",
  outros: "Outros",
};

interface SaleReceiptProps {
  items: CartItem[];
  total: number;
  payments: TEFResult[];
  nfceNumber: string;
  onClose: () => void;
}

export function SaleReceipt({ items, total, payments, nfceNumber, onClose }: SaleReceiptProps) {
  const isSplit = payments.length > 1;

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

        {/* Payment details */}
        <div className="px-6 py-4 border-t border-pos-border space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-pos-text-muted">
                {isSplit ? "Pagamentos" : "Pagamento"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-pos-text-muted">Total</p>
              <p className="pos-price text-xl">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Each payment */}
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-pos-bg space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-pos-text">
                    {methodLabels[p.method] || p.method}
                  </span>
                  <span className="pos-price text-sm">{formatCurrency(p.amount)}</span>
                </div>

                <div className="space-y-1 text-xs">
                  {p.nsu && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">NSU</span>
                      <span className="font-mono text-pos-text">{p.nsu}</span>
                    </div>
                  )}
                  {p.authCode && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Autorização</span>
                      <span className="font-mono text-pos-text">{p.authCode}</span>
                    </div>
                  )}
                  {p.cardBrand && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Bandeira</span>
                      <span className="text-pos-text">{p.cardBrand} •••• {p.cardLastDigits}</span>
                    </div>
                  )}
                  {p.installments && p.installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Parcelas</span>
                      <span className="text-pos-text">{p.installments}×</span>
                    </div>
                  )}
                  {p.changeAmount !== undefined && p.changeAmount > 0 && (
                    <div className="flex justify-between pt-1 border-t border-pos-border">
                      <span className="text-pos-text-muted font-medium">Troco</span>
                      <span className="pos-price">{formatCurrency(p.changeAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
