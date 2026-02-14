import { FileText, Download, Eye, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { useSales, type Sale } from "@/hooks/useSales";
import { Skeleton } from "@/components/ui/skeleton";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  voucher: "Voucher",
  prazo: "A Prazo",
  outros: "Outros",
};

export default function Vendas() {
  const { data: sales = [], isLoading, refetch } = useSales(100);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sales.length} vendas registradas localmente
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Nenhuma venda encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">As vendas realizadas no PDV aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale, i) => {
            const items = Array.isArray(sale.items_json) ? sale.items_json : sale.items_json ? JSON.parse(String(sale.items_json)) : [];
            const isSynced = !!sale.synced_at;

            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-xl card-shadow border border-border p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm font-mono">
                          {sale.id.slice(0, 8).toUpperCase()}
                        </span>
                        {sale.number && (
                          <span className="text-xs font-mono text-muted-foreground">
                            NFC-e #{sale.number}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(sale.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        isSynced
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {isSynced ? "Sincronizado" : "Pendente"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-4">
                    <span className="text-sm text-muted-foreground">
                      {items.length} {items.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {paymentLabels[sale.payment_method || ""] || sale.payment_method || "—"}
                    </span>
                    {sale.customer_name && (
                      <span className="text-sm text-muted-foreground">
                        {sale.customer_name}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold font-mono text-primary">
                    {formatCurrency(sale.total_value)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
