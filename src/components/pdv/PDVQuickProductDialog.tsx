import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLocalProduct } from "@/hooks/useLocalProducts";
import { PackagePlus } from "lucide-react";

const units = ["UN", "KG", "LT", "MT", "CX", "PCT"];
const categories = ["Bebidas", "Alimentos", "Limpeza", "Higiene", "Hortifrúti", "Padaria", "Frios", "Outros"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBarcode?: string;
  onProductCreated?: () => void;
}

export function PDVQuickProductDialog({ open, onOpenChange, initialBarcode = "", onProductCreated }: Props) {
  const createProduct = useCreateLocalProduct();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: initialBarcode,
    price: "",
    cost_price: "",
    stock_quantity: "1",
    unit: "UN",
    category: "",
    ncm: "",
  });

  // Sync initialBarcode when dialog opens with a new barcode
  useEffect(() => {
    if (open && initialBarcode) {
      setForm((p) => ({ ...p, barcode: initialBarcode }));
    }
    if (open) {
      // Reset form when dialog opens
      setForm({ name: "", sku: "", barcode: initialBarcode || "", price: "", cost_price: "", stock_quantity: "1", unit: "UN", category: "", ncm: "" });
    }
  }, [open, initialBarcode]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const price = parseFloat(form.price) || 0;
    if (price <= 0) return;

    await createProduct.mutateAsync({
      name: form.name.trim(),
      sku: form.sku.trim() || form.name.trim().substring(0, 10).toUpperCase().replace(/\s/g, ""),
      barcode: form.barcode.trim() || null,
      price,
      cost_price: parseFloat(form.cost_price) || 0,
      stock_quantity: parseFloat(form.stock_quantity) || 0,
      unit: form.unit,
      category: form.category || null,
      ncm: form.ncm.trim() || null,
    } as any);

    onOpenChange(false);
    onProductCreated?.();
    // Reset form
    setForm({ name: "", sku: "", barcode: "", price: "", cost_price: "", stock_quantity: "1", unit: "UN", category: "", ncm: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-primary" />
            Cadastro Rápido de Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome do Produto *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Coca-Cola 2L" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">SKU</Label>
              <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} placeholder="Auto" />
            </div>
            <div>
              <Label className="text-xs">Código de Barras</Label>
              <Input value={form.barcode} onChange={(e) => update("barcode", e.target.value)} placeholder="7891234567890" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Preço Venda *</Label>
              <CurrencyInput value={parseFloat(form.price) || 0} onChange={(v) => update("price", String(v))} />
            </div>
            <div>
              <Label className="text-xs">Preço Custo</Label>
              <CurrencyInput value={parseFloat(form.cost_price) || 0} onChange={(v) => update("cost_price", String(v))} />
            </div>
            <div>
              <Label className="text-xs">Estoque</Label>
              <Input type="number" step="1" value={form.stock_quantity} onChange={(e) => update("stock_quantity", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">NCM</Label>
              <Input value={form.ncm} onChange={(e) => update("ncm", e.target.value)} placeholder="22021000" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createProduct.isPending || !form.name.trim() || !(parseFloat(form.price) > 0)}>
            {createProduct.isPending ? "Salvando..." : "Cadastrar e Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
