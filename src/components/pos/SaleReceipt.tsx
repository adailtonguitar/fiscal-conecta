import { Check, Printer, X } from "lucide-react";
import { formatCurrency, type CartItem } from "@/lib/mock-data";
import { type TEFResult } from "@/components/pos/TEFProcessor";
import { motion } from "framer-motion";
import { toast } from "sonner";

const methodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  debito: "Cartão Débito",
  credito: "Cartão Crédito",
  pix: "PIX",
  voucher: "Vale Alimentação",
  outros: "Outros",
};

interface SaleReceiptProps {
  items: CartItem[];
  total: number;
  payments: TEFResult[];
  nfceNumber: string;
  slogan?: string;
  logoUrl?: string;
  companyName?: string;
  onClose: () => void;
}

export function SaleReceipt({ items, total, payments, nfceNumber, slogan, logoUrl, companyName, onClose }: SaleReceiptProps) {
  const hasCreditPayment = payments.some(p => p.method === "prazo");

  // Consolidate payments by method (group identical methods, sum amounts)
  const consolidatedPayments = (() => {
    const map = new Map<string, TEFResult>();
    for (const p of payments) {
      const existing = map.get(p.method);
      if (existing) {
        map.set(p.method, {
          ...existing,
          amount: existing.amount + p.amount,
          changeAmount: (existing.changeAmount || 0) + (p.changeAmount || 0),
        });
      } else {
        map.set(p.method, { ...p });
      }
    }
    return Array.from(map.values());
  })();

  const isSplit = consolidatedPayments.length > 1;

  const handlePrint = () => {
    try {
      // Build a printable receipt window
      const paymentLines = consolidatedPayments.map(p => {
        const label = methodLabels[p.method] || p.method;
        let line = `${label}: ${formatCurrency(p.amount)}`;
        if (p.nsu) line += ` | NSU: ${p.nsu}`;
        if (p.cardBrand) line += ` | ${p.cardBrand} •••• ${p.cardLastDigits}`;
        if (p.changeAmount && p.changeAmount > 0) line += ` | Troco: ${formatCurrency(p.changeAmount)}`;
        return line;
      }).join('\n');

      const itemLines = items.map(item =>
        `${item.quantity}× ${item.name} — ${formatCurrency(item.price * item.quantity)}`
      ).join('\n');

      const receiptContent = `
        <html>
        <head>
          <title>Cupom NFC-e #${nfceNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 20px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            .line { margin: 4px 0; }
            .total { font-size: 16px; font-weight: bold; margin: 8px 0; }
          </style>
        </head>
        <body>
          ${logoUrl ? `<div class="center" style="margin-bottom:8px;"><img src="${logoUrl}" alt="Logo" style="max-height:48px;max-width:200px;object-fit:contain;" /></div>` : ""}
          ${companyName ? `<div class="center bold" style="font-size:14px;">${companyName}</div>` : ""}
          <div class="center bold" style="font-size:16px;">CUPOM NÃO FISCAL</div>
          ${slogan ? `<div class="center line" style="font-style:italic;font-size:11px;">${slogan}</div>` : ""}
          <div class="separator"></div>
          <div class="center bold">NFC-e #${nfceNumber}</div>
          <div class="center line">${new Date().toLocaleString('pt-BR')}</div>
          <div class="separator"></div>
          <div class="bold line">ITENS:</div>
          <pre>${itemLines}</pre>
          <div class="separator"></div>
          <div class="total center">TOTAL: ${formatCurrency(total)}</div>
          <div class="separator"></div>
          <div class="bold line">PAGAMENTO:</div>
          <pre>${paymentLines}</pre>
          <div class="separator"></div>
          ${hasCreditPayment ? `
          <div style="margin-top:12px; font-size:10px;">
            <div class="center line">Declaro ter recebido os produtos acima e me comprometo ao pagamento conforme acordado.</div>
            <div style="margin-top:20px; border-top:1px dashed #000; width:85%; margin-left:auto; margin-right:auto;"></div>
            <div class="center line">Nome</div>
            <div style="margin-top:16px; border-top:1px dashed #000; width:85%; margin-left:auto; margin-right:auto;"></div>
            <div class="center line">CPF</div>
            <div style="margin-top:24px; border-top:1px dashed #000; width:85%; margin-left:auto; margin-right:auto;"></div>
            <div class="center line">Assinatura do Responsável</div>
            <div class="center line" style="margin-top:6px;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
          <div class="separator"></div>
          ` : ''}
          <div class="center line" style="margin-top:16px;">Obrigado pela preferência!</div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } else {
        toast.error("Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.");
      }
    } catch (err) {
      toast.error("Erro ao imprimir cupom.");
    }
  };

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
          {logoUrl && (
            <img src={logoUrl} alt={companyName || "Logo"} className="h-12 mb-2 object-contain" />
          )}
          {companyName && (
            <p className="text-sm font-semibold text-pos-text">{companyName}</p>
          )}
          {slogan && (
            <p className="text-xs text-pos-text-muted italic">{slogan}</p>
          )}
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4 mt-3">
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
            {consolidatedPayments.map((p, i) => (
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

        {/* Signature area for credit sales (prazo/fiado) */}
        {hasCreditPayment && (
          <div className="px-6 py-4 border-t border-pos-border space-y-3">
            <p className="text-xs text-pos-text-muted text-center">
              Declaro ter recebido os produtos acima descritos e me comprometo ao pagamento conforme acordado.
            </p>
            <div className="pt-6 mx-2">
              <div className="border-t border-pos-text-muted/40 border-dashed" />
              <p className="text-[10px] text-pos-text-muted text-center mt-0.5">
                Nome
              </p>
            </div>
            <div className="pt-4 mx-2">
              <div className="border-t border-pos-text-muted/40 border-dashed" />
              <p className="text-[10px] text-pos-text-muted text-center mt-0.5">
                CPF
              </p>
            </div>
            <div className="pt-6 mx-2">
              <div className="border-t border-pos-text-muted/40 border-dashed" />
              <p className="text-[10px] text-pos-text-muted text-center mt-0.5">
                Assinatura do Responsável
              </p>
            </div>
            <p className="text-[10px] text-pos-text-muted text-center">
              Data: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-pos-border">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-bg text-pos-text-muted text-sm font-medium hover:bg-pos-surface-hover transition-all"
          >
            <X className="w-4 h-4" />
            Fechar
          </button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
