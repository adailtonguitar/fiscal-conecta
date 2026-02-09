import { AlertTriangle } from "lucide-react";
import type { Product } from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/mock-data";

interface Props {
  products: Product[];
}

export function LowStockAlert({ products }: Props) {
  const lowStock = products.filter(
    (p) => p.is_active && p.min_stock != null && p.min_stock > 0 && p.stock_quantity <= p.min_stock
  );

  if (lowStock.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <span className="text-sm font-semibold text-foreground">
          {lowStock.length} produto{lowStock.length > 1 ? "s" : ""} com estoque baixo
        </span>
      </div>
      <div className="grid gap-2">
        {lowStock.slice(0, 5).map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{p.name}</span>
            <span className="font-mono text-destructive font-semibold">
              {p.stock_quantity} / {p.min_stock} {p.unit}
            </span>
          </div>
        ))}
        {lowStock.length > 5 && (
          <p className="text-xs text-muted-foreground">+{lowStock.length - 5} outros produtos</p>
        )}
      </div>
    </div>
  );
}
