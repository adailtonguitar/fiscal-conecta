import { FileText, Download, Eye, RefreshCw } from "lucide-react";
import { recentSales, formatCurrency } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function Vendas() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Todas as vendas realizadas</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Sales cards */}
      <div className="space-y-3">
        {recentSales.map((sale, i) => (
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
                    <span className="font-semibold text-foreground">{sale.id}</span>
                    {sale.nfceNumber && (
                      <span className="text-xs font-mono text-muted-foreground">
                        NFC-e #{sale.nfceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {new Date(sale.date).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    sale.synced
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {sale.synced ? "Sincronizado" : "Pendente"}
                </span>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
              <div className="flex gap-4">
                <span className="text-sm text-muted-foreground">
                  {sale.items.length} {sale.items.length === 1 ? "item" : "itens"}
                </span>
                <span className="text-sm text-muted-foreground">{sale.paymentMethod}</span>
              </div>
              <span className="text-lg font-bold font-mono text-primary">
                {formatCurrency(sale.total)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
