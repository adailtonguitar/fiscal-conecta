import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Send, Trash2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { FiscalEmissionService } from "@/services/FiscalEmissionService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Sale } from "@/hooks/useSales";

type DocType = "nfce" | "nfe";

interface NfceItem {
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  unit: string;
  ncm: string;
}

function parseSaleItems(sale: Sale): NfceItem[] {
  try {
    const raw = sale.items_json;
    let arr: any[] = [];
    if (Array.isArray(raw)) {
      arr = raw;
    } else if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as any).items) {
      arr = (raw as any).items;
    } else if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : parsed?.items || [];
    }
    return arr.map((item: any) => ({
      product_id: item.product_id || item.id || "",
      name: item.name || "Produto",
      sku: item.sku || item.barcode || "",
      quantity: item.quantity || 1,
      unit_price: item.price || item.unit_price || 0,
      unit: item.unit || "UN",
      ncm: item.ncm || "",
    }));
  } catch {
    return [];
  }
}

interface Props {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function ProductSearchPopover({ onSelect }: { onSelect: (product: any) => void }) {
  const { companyId } = useCompany();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) {
      setSearch("");
      setResults([]);
      return;
    }
    // Focus input when popover opens
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    if (!companyId || !searchOpen) return;
    const term = search.trim();
    if (term.length < 1) {
      // Load recent products
      const load = async () => {
        setLoading(true);
        const { data } = await supabase
          .from("products")
          .select("id, name, sku, barcode, price, unit, ncm, stock_quantity")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name")
          .limit(20);
        setResults(data || []);
        setLoading(false);
      };
      load();
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, price, unit, ncm, stock_quantity")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .or(`name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%`)
        .order("name")
        .limit(20);
      setResults(data || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, companyId, searchOpen]);

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-1">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Item
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar produto por nome, SKU ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="max-h-52 overflow-y-auto space-y-0.5">
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
          )}
          {!loading &&
            results.map((p) => (
              <button
                key={p.id}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm flex items-center justify-between gap-2"
                onClick={() => {
                  onSelect(p);
                  setSearchOpen(false);
                }}
              >
                <div className="min-w-0">
                  <span className="block truncate font-medium">{p.name}</span>
                  {p.sku && <span className="text-xs text-muted-foreground">SKU: {p.sku}</span>}
                </div>
                <span className="text-xs font-mono text-primary whitespace-nowrap">
                  {formatCurrency(p.price || 0)}
                </span>
              </button>
            ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-1 text-xs"
          onClick={() => {
            onSelect({ id: "", name: "Novo Produto", sku: "", price: 0, unit: "UN", ncm: "" });
            setSearchOpen(false);
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Adicionar manualmente
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function NfceEmissionDialog({ sale, open, onOpenChange, onSuccess }: Props) {
  const [items, setItems] = useState<NfceItem[]>([]);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [docType, setDocType] = useState<DocType>("nfce");
  const [emitting, setEmitting] = useState(false);

  // Reset state when sale changes
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  if (sale && sale.id !== lastSaleId) {
    setLastSaleId(sale.id);
    setItems(parseSaleItems(sale));
    setCustomerCpf(sale.customer_cpf_cnpj || "");
    setCustomerName(sale.customer_name || "");
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

  const updateItem = (index: number, field: keyof NfceItem, value: string | number) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addProductFromSearch = (product: any) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id || "",
        name: product.name || "Novo Produto",
        sku: product.sku || product.barcode || "",
        quantity: 1,
        unit_price: product.price || 0,
        unit: product.unit || "UN",
        ncm: product.ncm || "",
      },
    ]);
  };

  const handleEmit = async () => {
    if (!sale || items.length === 0) {
      toast.error("Adicione pelo menos um item para emitir.");
      return;
    }
    setEmitting(true);
    try {
      const docLabel = docType === "nfce" ? "NFC-e" : "NF-e";
      console.log("[NfceEmission] Starting emission:", { docType, saleId: sale.id, itemsCount: items.length, total });
      const result = await FiscalEmissionService.emitirNfce({
        fiscalDocumentId: sale.id,
        items,
        total,
        paymentMethod: sale.payment_method || "dinheiro",
        customerCpf: customerCpf || undefined,
        customerName: customerName || undefined,
      });
      console.log("[NfceEmission] Result:", result);

      if (result?.success || result?.status === "autorizada") {
        toast.success(`${docLabel} emitida com sucesso!`);
        onOpenChange(false);
        onSuccess();
      } else {
        const errorMsg = result?.message || result?.error || `Erro ao emitir ${docLabel}. Verifique a configuração fiscal.`;
        toast.error(errorMsg, { duration: 8000 });
      }
    } catch (err: any) {
      console.error("[NfceEmission] Error:", err);
      const msg = err?.message || "";
      if (msg.includes("invalid_client")) {
        toast.error("Credenciais da API fiscal inválidas ou expiradas. Atualize nas configurações.", { duration: 8000 });
      } else {
        toast.error(msg || `Erro ao emitir ${docType === "nfce" ? "NFC-e" : "NF-e"}`);
      }
    } finally {
      setEmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emitir Documento Fiscal — Revisão</DialogTitle>
        </DialogHeader>

        {/* Doc type + Customer info */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Modelo</label>
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nfce">NFC-e (Consumidor)</SelectItem>
                <SelectItem value="nfe">NF-e (Completa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">CPF/CNPJ do Cliente</label>
            <Input value={customerCpf} onChange={(e) => setCustomerCpf(e.target.value)} placeholder="Opcional" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome do Cliente</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Opcional" className="mt-1" />
          </div>
        </div>

        {/* Items table */}
        <div className="space-y-2 mt-2">
          <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Produto</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Preço Unit.</span>
            <span />
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 items-center">
              <Input
                value={item.name}
                onChange={(e) => updateItem(idx, "name", e.target.value)}
                className="text-sm h-9"
              />
              <Input
                type="number"
                min={0.001}
                step="any"
                value={item.quantity}
                onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                className="text-sm h-9 text-right"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                className="text-sm h-9 text-right"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive"
                onClick={() => removeItem(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <ProductSearchPopover onSelect={addProductFromSearch} />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          <span className="text-sm font-medium text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</span>
          <span className="text-lg font-bold font-mono text-primary">{formatCurrency(total)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={emitting}>
            Cancelar
          </Button>
          <Button onClick={handleEmit} disabled={emitting || items.length === 0}>
            {emitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Emitir {docType === "nfce" ? "NFC-e" : "NF-e"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
