import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ShoppingCart, Undo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStockMovements } from "@/hooks/useLocalStock";
import { formatCurrency } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

const typeConfig: Record<string, { icon: typeof ArrowDownCircle; label: string; color: string }> = {
  entrada: { icon: ArrowDownCircle, label: "Entrada", color: "text-green-600 bg-green-50" },
  saida: { icon: ArrowUpCircle, label: "Saída", color: "text-red-600 bg-red-50" },
  ajuste: { icon: RefreshCw, label: "Ajuste", color: "text-blue-600 bg-blue-50" },
  venda: { icon: ShoppingCart, label: "Venda", color: "text-orange-600 bg-orange-50" },
  devolucao: { icon: Undo2, label: "Devolução", color: "text-purple-600 bg-purple-50" },
};

export function MovementHistoryDialog({ open, onOpenChange, productId, productName }: Props) {
  const { data: movements, isLoading } = useLocalStockMovements(productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico — {productName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : movements && movements.length > 0 ? (
          <div className="divide-y divide-border">
            {movements.map((m) => {
              const cfg = typeConfig[m.type] ?? typeConfig.ajuste;
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.reason || m.reference || "Sem observação"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {m.previous_stock} → {m.new_stock}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação encontrada.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
