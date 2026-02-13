import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateLocalProduct } from "@/hooks/useLocalProducts";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  name: string;
  sku: string;
  ncm?: string;
  category?: string;
  unit: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock?: number;
  barcode?: string;
}

export function CSVImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const createProduct = useCreateLocalProduct();

  const parseCSV = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrors(["Arquivo vazio ou sem dados"]);
      return;
    }

    const header = lines[0].toLowerCase().split(";").map(h => h.trim());
    const nameIdx = header.findIndex(h => h.includes("nome") || h === "name");
    const skuIdx = header.findIndex(h => h.includes("sku") || h.includes("codigo"));
    const priceIdx = header.findIndex(h => h.includes("preco") || h.includes("preço") || h === "price");
    const stockIdx = header.findIndex(h => h.includes("estoque") || h.includes("stock") || h.includes("qtd"));
    const unitIdx = header.findIndex(h => h.includes("unidade") || h === "unit" || h === "un");
    const ncmIdx = header.findIndex(h => h.includes("ncm"));
    const categoryIdx = header.findIndex(h => h.includes("categoria") || h.includes("category"));
    const costIdx = header.findIndex(h => h.includes("custo") || h.includes("cost"));
    const minIdx = header.findIndex(h => h.includes("minimo") || h.includes("mínimo") || h.includes("min"));
    const barcodeIdx = header.findIndex(h => h.includes("barcode") || h.includes("ean") || h.includes("gtin"));

    if (nameIdx === -1 || skuIdx === -1) {
      setErrors(["Colunas obrigatórias não encontradas: nome, sku"]);
      return;
    }

    const parsed: ParsedRow[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map(c => c.trim());
      const name = cols[nameIdx];
      const sku = cols[skuIdx];
      if (!name || !sku) {
        errs.push(`Linha ${i + 1}: nome ou SKU vazio`);
        continue;
      }
      parsed.push({
        name,
        sku,
        ncm: ncmIdx >= 0 ? cols[ncmIdx] : undefined,
        category: categoryIdx >= 0 ? cols[categoryIdx] : undefined,
        unit: unitIdx >= 0 ? (cols[unitIdx] || "UN") : "UN",
        price: priceIdx >= 0 ? parseFloat(cols[priceIdx]?.replace(",", ".") || "0") : 0,
        cost_price: costIdx >= 0 ? parseFloat(cols[costIdx]?.replace(",", ".") || "0") : 0,
        stock_quantity: stockIdx >= 0 ? parseFloat(cols[stockIdx]?.replace(",", ".") || "0") : 0,
        min_stock: minIdx >= 0 ? parseFloat(cols[minIdx]?.replace(",", ".") || "0") : 0,
        barcode: barcodeIdx >= 0 ? cols[barcodeIdx] : undefined,
      });
    }

    setRows(parsed);
    setErrors(errs);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRows([]);
    setErrors([]);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    const errs: string[] = [];
    for (const row of rows) {
      try {
        await createProduct.mutateAsync(row);
        success++;
      } catch (e: any) {
        errs.push(`${row.sku}: ${e.message}`);
      }
    }
    setImporting(false);
    setDone(true);
    if (errs.length) setErrors(errs);
    toast.success(`${success} de ${rows.length} produtos importados`);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setRows([]);
      setErrors([]);
      setDone(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Produtos (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arquivo CSV separado por <code className="bg-muted px-1 rounded">;</code>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Colunas: nome; sku; ncm; categoria; unidade; preço; custo; estoque; mínimo; barcode
            </p>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </div>

          {rows.length > 0 && !done && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">{rows.length} produtos encontrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                Prévia: {rows.slice(0, 3).map(r => r.name).join(", ")}{rows.length > 3 ? "..." : ""}
              </p>
              <Button className="mt-3 w-full" onClick={handleImport} disabled={importing}>
                {importing ? "Importando..." : `Importar ${rows.length} Produtos`}
              </Button>
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 rounded-lg bg-accent p-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Importação concluída!</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">{errors.length} erros</span>
              </div>
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-muted-foreground">{e}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
