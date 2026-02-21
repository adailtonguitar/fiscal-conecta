import { useState, useMemo } from "react";
import { Package, AlertTriangle, Plus, Send, Check, ShoppingCart, Truck, Search, X } from "lucide-react";
import { useReorderSuggestions, usePurchaseOrders, useCreatePurchaseOrder, useUpdatePurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/mock-data";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusLabels: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  enviado: { label: "Enviado", color: "bg-primary/10 text-primary" },
  recebido: { label: "Recebido", color: "bg-accent text-accent-foreground" },
  cancelado: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
};

export default function PedidosCompra() {
  const { user } = useAuth();
  const { data: suggestions = [] } = useReorderSuggestions();
  const { data: allProducts = [] } = useProducts();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const createOrder = useCreatePurchaseOrder();
  const updateStatus = useUpdatePurchaseOrderStatus();

  const [tab, setTab] = useState<"suggestions" | "orders">("suggestions");
  const [selectedItems, setSelectedItems] = useState<Record<string, { qty: number; cost: number }>>({});
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [search, setSearch] = useState("");

  // Group suggestions by supplier
  // When searching, show all matching products; otherwise show only reorder suggestions
  const filteredSuggestions = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (searchLower) {
      return allProducts
        .filter(p => p.is_active)
        .filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower)
        )
        .map(p => ({
          ...p,
          reorder_point: p.reorder_point ?? 0,
          reorder_quantity: p.reorder_quantity ?? 0,
        }));
    }
    return suggestions.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower)
    );
  }, [suggestions, allProducts, search]);

  const toggleItem = (id: string, qty: number, cost: number) => {
    setSelectedItems(prev => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { qty, cost } };
    });
  };

  const selectAll = () => {
    const items: Record<string, { qty: number; cost: number }> = {};
    filteredSuggestions.forEach(p => {
      items[p.id] = {
        qty: Number(p.reorder_quantity) || Number(p.reorder_point) * 2,
        cost: Number(p.cost_price) || 0,
      };
    });
    setSelectedItems(items);
  };

  const handleCreateOrder = async () => {
    if (!user) return;
    const items = Object.entries(selectedItems).map(([product_id, { qty, cost }]) => ({
      product_id,
      quantity: qty,
      unit_cost: cost,
    }));
    if (items.length === 0) {
      toast.warning("Selecione ao menos um produto");
      return;
    }
    await createOrder.mutateAsync({
      supplier_id: selectedSupplier || undefined,
      created_by: user.id,
      items,
    });
    setSelectedItems({});
    setTab("orders");
  };

  const handlePrint = async (order: any) => {
    // Fetch order items with product details
    const { data: items } = await supabase
      .from("purchase_order_items")
      .select("*, products(name, sku, unit)")
      .eq("order_id", order.id);

    const w = window.open("", "_blank", "width=600,height=800");
    if (!w) return;
    const supplier = suppliers.find(s => s.id === order.supplier_id);
    const itemsRows = (items || []).map((item: any) => `
      <tr>
        <td style="border:1px solid #ddd;padding:8px">${item.products?.name || "—"}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:center">${item.quantity} ${item.products?.unit || "un"}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">R$ ${Number(item.unit_cost || 0).toFixed(2).replace(".", ",")}</td>
        <td style="border:1px solid #ddd;padding:8px;text-align:right">R$ ${Number(item.total || 0).toFixed(2).replace(".", ",")}</td>
      </tr>
    `).join("");

    w.document.write(`
      <html><head><title>Pedido de Compra</title>
      <style>body{font-family:sans-serif;padding:24px;font-size:14px}
      h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head>
      <body>
      <h1>Pedido de Compra #${order.id.slice(0, 8)}</h1>
      <p><strong>Fornecedor:</strong> ${supplier?.name || "Não especificado"}</p>
      <p><strong>Data:</strong> ${format(new Date(order.created_at), "dd/MM/yyyy")}</p>
      <p><strong>Status:</strong> ${statusLabels[order.status]?.label || order.status}</p>
      ${order.notes ? `<p><strong>Observações:</strong> ${order.notes}</p>` : ""}
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th style="text-align:center">Qtd</th>
            <th style="text-align:right">Custo Unit.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
        <tfoot>
          <tr style="font-weight:bold;background:#f9f9f9">
            <td colspan="3" style="border:1px solid #ddd;padding:8px;text-align:right">Total:</td>
            <td style="border:1px solid #ddd;padding:8px;text-align:right">R$ ${Number(order.total_value || 0).toFixed(2).replace(".", ",")}</td>
          </tr>
        </tfoot>
      </table>
      <hr style="margin-top:24px"/><p style="margin-top:16px;text-align:center;font-size:12px;color:#888">Gerado pelo sistema</p>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const selectedCount = Object.keys(selectedItems).length;
  const selectedTotal = Object.values(selectedItems).reduce((s, i) => s + i.qty * i.cost, 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos de Compra</h1>
          <p className="text-sm text-muted-foreground mt-1">Sugestões automáticas e gestão de pedidos para fornecedores</p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Produtos Abaixo do Mínimo</p>
              <p className="text-lg font-bold text-foreground">{suggestions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pedidos em Aberto</p>
              <p className="text-lg font-bold text-foreground">
                {orders.filter(o => o.status === "rascunho" || o.status === "enviado").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Check className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebidos (mês)</p>
              <p className="text-lg font-bold text-foreground">
                {orders.filter(o => o.status === "recebido").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2">
        <Button
          variant={tab === "suggestions" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("suggestions")}
        >
          <AlertTriangle className="w-4 h-4 mr-1.5" />
          Sugestões ({suggestions.length})
        </Button>
        <Button
          variant={tab === "orders" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("orders")}
        >
          <Package className="w-4 h-4 mr-1.5" />
          Pedidos ({orders.length})
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {tab === "suggestions" ? (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todos
              </Button>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreateOrder}
                disabled={selectedCount === 0 || createOrder.isPending}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Gerar Pedido ({selectedCount})
              </Button>
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Check className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Todos os produtos estão acima do ponto de reposição!</p>
                <p className="text-xs mt-1">Configure o "Ponto de Reposição" nos produtos para ativar sugestões.</p>
              </div>
            ) : (
              <>
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {filteredSuggestions.map(p => {
                  const isSelected = !!selectedItems[p.id];
                  const suggestedQty = Number(p.reorder_quantity) || Number(p.reorder_point) * 2;
                  const cost = Number(p.cost_price) || 0;
                  return (
                    <div
                      key={p.id}
                      className={`bg-card rounded-xl border p-4 space-y-2 cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => toggleItem(p.id, suggestedQty, cost)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 mr-2">
                          <p className="font-medium text-foreground text-sm truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </div>
                        <input type="checkbox" checked={isSelected} readOnly className="rounded border-border flex-shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Estoque: <strong className="text-destructive">{Number(p.stock_quantity)}</strong> / Mín: {Number(p.reorder_point)}</span>
                        <span className="font-mono font-semibold text-foreground">Sugerido: {isSelected ? selectedItems[p.id].qty : suggestedQty}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Custo: <strong className="font-mono text-foreground">{formatCurrency(cost)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="p-3 text-left w-10"></th>
                      <th className="p-3 text-left">Produto</th>
                      <th className="p-3 text-right">Estoque</th>
                      <th className="p-3 text-right">Mín.</th>
                      <th className="p-3 text-right">Qtd. Sugerida</th>
                      <th className="p-3 text-right">Custo Unit.</th>
                      <th className="p-3 text-right">Custo Unit.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuggestions.map(p => {
                      const isSelected = !!selectedItems[p.id];
                      const suggestedQty = Number(p.reorder_quantity) || Number(p.reorder_point) * 2;
                      const cost = Number(p.cost_price) || 0;
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                          }`}
                          onClick={() => toggleItem(p.id, suggestedQty, cost)}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded border-border"
                            />
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </td>
                          <td className="p-3 text-right font-mono">
                            <span className="text-destructive font-semibold">{Number(p.stock_quantity)}</span>
                            <span className="text-muted-foreground text-xs ml-1">{p.unit}</span>
                          </td>
                          <td className="p-3 text-right font-mono text-muted-foreground">
                            {Number(p.reorder_point)}
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-foreground">
                            {isSelected ? selectedItems[p.id].qty : suggestedQty}
                          </td>
                          <td className="p-3 text-right font-mono text-foreground">
                            {formatCurrency(cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}

            {selectedCount > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-bold">{selectedCount}</span> produtos selecionados • Total estimado:{" "}
                  <span className="font-bold font-mono">{formatCurrency(selectedTotal)}</span>
                </p>
                <Button onClick={handleCreateOrder} disabled={createOrder.isPending}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Gerar Pedido
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum pedido de compra</p>
              </div>
            ) : (
              orders.map(order => {
                const st = statusLabels[order.status] || statusLabels.rascunho;
                const supplierName = (order as any).suppliers?.name || "Sem fornecedor";
                return (
                    <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            Pedido #{order.id.slice(0, 8)}
                          </p>
                          <Badge className={st.color}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {supplierName} • {format(new Date(order.created_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-13 sm:ml-0">
                      <p className="text-sm font-bold font-mono text-foreground">
                        {formatCurrency(Number(order.total_value))}
                      </p>
                      {order.status === "rascunho" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const supplier = suppliers.find(s => s.id === order.supplier_id);
                            updateStatus.mutate({
                              id: order.id,
                              status: "enviado",
                              supplierEmail: supplier?.email || undefined,
                              supplierName: supplier?.name || undefined,
                              totalValue: Number(order.total_value),
                            });
                          }}
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          Enviar
                        </Button>
                      )}
                      {order.status === "enviado" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus.mutate({ id: order.id, status: "recebido", received_by: user?.id })}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Receber
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handlePrint(order)} className="hidden sm:flex">
                        Imprimir
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
