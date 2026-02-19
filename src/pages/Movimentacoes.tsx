import { useState } from "react";
import { ArrowUpDown, Search, Package, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalStockMovements, type LocalStockMovement } from "@/hooks/useLocalStock";
import { useLocalProducts, type LocalProduct } from "@/hooks/useLocalProducts";
import { BatchMovementMode } from "@/components/stock/BatchMovementMode";
import { StockMovementDialog } from "@/components/stock/StockMovementDialog";

const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  entrada: { label: "Entrada", variant: "default" },
  saida: { label: "Saída", variant: "destructive" },
  ajuste: { label: "Ajuste", variant: "outline" },
  venda: { label: "Venda", variant: "secondary" },
  devolucao: { label: "Devolução", variant: "default" },
};

export default function Movimentacoes() {
  const { data: movements = [], isLoading } = useLocalStockMovements();
  const { data: products = [] } = useLocalProducts();
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [movementProduct, setMovementProduct] = useState<LocalProduct | null>(null);

  const getProductName = (m: LocalStockMovement) => {
    const p = products.find(prod => prod.id === m.product_id);
    return p?.name ?? "—";
  };
  const getProductSku = (m: LocalStockMovement) => {
    const p = products.find(prod => prod.id === m.product_id);
    return p?.sku ?? "";
  };

  const filtered = movements.filter((m) => {
    const name = getProductName(m).toLowerCase();
    const sku = getProductSku(m).toLowerCase();
    return name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());
  });

  if (batchMode) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <BatchMovementMode products={products as any} onClose={() => setBatchMode(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6" />
            Movimentações de Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico completo de entradas, saídas e ajustes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { setProductSearch(""); setShowNewEntry(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBatchMode(true)}>
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Movimentação em Lote
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Data</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Produto</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Qtd</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Anterior</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Novo</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-5 py-3"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((m: any) => {
                  const info = typeLabels[m.type] || { label: m.type, variant: "secondary" as const };
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          {getProductName(m)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={info.variant}>{info.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">{m.quantity}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted-foreground">{m.previous_stock}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{m.new_stock}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{m.reason || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showNewEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[80vh] overflow-y-auto space-y-4">
            <h2 className="text-lg font-bold text-foreground">Selecione o Produto</h2>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="space-y-1">
              {products
                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()))
                .slice(0, 20)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setMovementProduct(p);
                      setShowNewEntry(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 text-sm text-foreground flex justify-between items-center"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">Estoque: {p.stock_quantity}</span>
                  </button>
                ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowNewEntry(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {movementProduct && (
        <StockMovementDialog
          open={!!movementProduct}
          onOpenChange={(v) => !v && setMovementProduct(null)}
          product={{ ...movementProduct!, is_active: !!movementProduct!.is_active } as any}
        />
      )}
    </div>
  );
}
