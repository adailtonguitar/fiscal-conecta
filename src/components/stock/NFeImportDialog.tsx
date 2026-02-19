import { useState, useRef, useCallback } from "react";
import { FileUp, Upload, Check, Link2, Plus, Pencil, X, FileText, AlertTriangle, ShieldAlert } from "lucide-react";
import { parseNFeXML, type NFeItem, type NFeData } from "@/lib/nfe-parser";
import { useProducts, useCreateProduct, type Product } from "@/hooks/useProducts";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { formatCurrency } from "@/lib/mock-data";
import { toast } from "sonner";
import { validateNcm, detectNcmDuplicates, type NcmIssue } from "@/lib/ncm-validator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MatchAction = "create" | "link";

interface ReviewItem {
  nfeItem: NFeItem;
  action: MatchAction;
  linkedProductId: string | null;
  linkedProductName: string | null;
  name: string;
  price: number;
  costPrice: number;
  unit: string;
  ncm: string;
  barcode: string;
  category: string;
  selected: boolean;
  ncmErrors: NcmIssue[];
  ncmWarnings: NcmIssue[];
}

export function NFeImportDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"upload" | "review" | "importing">("upload");
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: existingProducts = [], isLoading: loadingProducts } = useProducts();
  const createProduct = useCreateProduct();
  const createStockMovement = useCreateStockMovement();
  const { user } = useAuth();
  const { companyId } = useCompany();

  const reset = () => {
    setStep("upload");
    setNfeData(null);
    setReviewItems([]);
    setEditingIndex(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const findMatch = useCallback(
    (item: NFeItem): { product: Product; score: number } | null => {
      let bestMatch: { product: Product; score: number } | null = null;

      for (const p of existingProducts) {
        let score = 0;

        // Exact barcode match
        if (item.cEAN && item.cEAN !== "SEM GTIN" && p.barcode === item.cEAN) {
          score += 100;
        }

        // NCM match
        if (item.NCM && p.ncm === item.NCM) {
          score += 30;
        }

        // Name similarity (simple)
        const nfeName = item.xProd.toLowerCase();
        const prodName = p.name.toLowerCase();
        if (nfeName === prodName) {
          score += 80;
        } else if (prodName.includes(nfeName) || nfeName.includes(prodName)) {
          score += 40;
        } else {
          const nfeWords = nfeName.split(/\s+/);
          const matchCount = nfeWords.filter((w) => prodName.includes(w) && w.length > 2).length;
          if (matchCount >= 2) score += 20;
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { product: p, score };
        }
      }

      return bestMatch && bestMatch.score >= 30 ? bestMatch : null;
    },
    [existingProducts]
  );

  const processXML = (xmlString: string) => {
    try {
      const data = parseNFeXML(xmlString);
      setNfeData(data);

      const items: ReviewItem[] = data.items.map((item) => {
        const match = findMatch(item);
        const ncmResult = validateNcm(item.NCM);
        const ncmDuplicates = detectNcmDuplicates(
          match?.product.name ?? item.xProd,
          item.NCM,
          match?.product.id,
          existingProducts.map(p => ({ id: p.id, name: p.name, ncm: p.ncm }))
        );
        return {
          nfeItem: item,
          action: match ? "link" : "create",
          linkedProductId: match?.product.id ?? null,
          linkedProductName: match?.product.name ?? null,
          name: match?.product.name ?? item.xProd,
          price: match?.product.price ?? item.vUnCom,
          costPrice: item.vUnCom,
          unit: match?.product.unit ?? mapUnit(item.uCom),
          ncm: item.NCM,
          barcode: item.cEAN === "SEM GTIN" ? "" : item.cEAN,
          category: match?.product.category ?? "",
          selected: true,
          ncmErrors: ncmResult.errors,
          ncmWarnings: [...ncmResult.warnings, ...ncmDuplicates],
        };
      });

      setReviewItems(items);
      setStep("review");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar XML");
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Selecione um arquivo .xml");
      return;
    }

    if (loadingProducts) {
      toast.warning("Aguarde o carregamento dos produtos antes de importar...");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        console.log(`[NFeImport] File loaded: ${file.name}, size: ${text.length} chars`);
        processXML(text);
      } else {
        toast.error("Arquivo vazio ou não pôde ser lido");
      }
    };
    reader.onerror = () => toast.error("Erro ao ler arquivo. Tente novamente.");
    // Try UTF-8 first (most common for NF-e)
    reader.readAsText(file, "UTF-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const updateItem = (index: number, updates: Partial<ReviewItem>) => {
    setReviewItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleImport = async () => {
    if (!companyId || !user) {
      toast.error("Empresa ou usuário não encontrado");
      return;
    }

    const selected = reviewItems.filter((r) => r.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }

    setStep("importing");
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const item of selected) {
      try {
        if (item.action === "create") {
          // Create new product
          await createProduct.mutateAsync({
            name: item.name,
            sku: generateSKU(item),
            price: item.price,
            cost_price: item.costPrice,
            unit: item.unit,
            ncm: item.ncm,
            barcode: item.barcode || undefined,
            category: item.category || undefined,
            stock_quantity: item.nfeItem.qCom,
            min_stock: 0,
            is_active: true,
          });
          created++;
        } else if (item.action === "link" && item.linkedProductId) {
          // Add stock to existing product
          await createStockMovement.mutateAsync({
            product_id: item.linkedProductId,
            type: "entrada",
            quantity: item.nfeItem.qCom,
            unit_cost: item.costPrice,
            reason: `Entrada via NF-e ${nfeData?.nNF || ""}`,
            reference: nfeData?.chNFe || undefined,
          });
          updated++;
        }
      } catch (err) {
        console.error("Error importing item:", item.name, err);
        errors++;
      }
    }

    const parts: string[] = [];
    if (created > 0) parts.push(`${created} produto(s) criado(s)`);
    if (updated > 0) parts.push(`${updated} produto(s) atualizado(s)`);
    if (errors > 0) parts.push(`${errors} erro(s)`);

    if (errors === 0) {
      toast.success(`Importação concluída: ${parts.join(", ")}`);
    } else {
      toast.warning(`Importação parcial: ${parts.join(", ")}`);
    }

    handleClose(false);
  };

  const selectedCount = reviewItems.filter((r) => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Importar Produtos via NF-e
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Faça upload do XML da NF-e de compra para importar os produtos."}
            {step === "review" && `Revise os ${reviewItems.length} itens encontrados. Edite e selecione os que deseja importar.`}
            {step === "importing" && "Importando produtos..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              Arraste o XML da NF-e aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique para selecionar o arquivo
            </p>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo XML
            </Button>
          </div>
        )}

        {step === "review" && nfeData && (
          <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-1">
            {/* NF-e header info */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className="text-muted-foreground">NF-e nº: </span>
                <span className="font-medium">{nfeData.nNF}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Emitente: </span>
                <span className="font-medium">{nfeData.emitName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">CNPJ: </span>
                <span className="font-mono">{formatCNPJ(nfeData.emitCNPJ)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold text-primary">{formatCurrency(nfeData.totalValue)}</span>
              </div>
            </div>

            {/* Select all */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCount === reviewItems.length}
                  onChange={(e) =>
                    setReviewItems((prev) => prev.map((item) => ({ ...item, selected: e.target.checked })))
                  }
                  className="rounded"
                />
                Selecionar todos ({selectedCount}/{reviewItems.length})
              </label>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  {reviewItems.filter((r) => r.action === "create" && r.selected).length} novos
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Link2 className="w-3 h-3 mr-1" />
                  {reviewItems.filter((r) => r.action === "link" && r.selected).length} vinculados
                </Badge>
              </div>
            </div>

            {/* Items list */}
            <ScrollArea className="flex-1 min-h-[200px] max-h-[50vh] pr-2">
              <div className="space-y-2">
                {reviewItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-3 transition-colors ${
                      item.selected ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => updateItem(idx, { selected: e.target.checked })}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        {editingIndex === idx ? (
                          <EditItemForm
                            item={item}
                            existingProducts={existingProducts}
                            onUpdate={(updates) => updateItem(idx, updates)}
                            onClose={() => setEditingIndex(null)}
                          />
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">{item.name}</span>
                                {item.action === "link" ? (
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    <Link2 className="w-3 h-3 mr-1" />
                                    Vinculado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>NF-e: {item.nfeItem.xProd}</span>
                                <span>NCM: {item.ncm}</span>
                                <span>Qtd: {item.nfeItem.qCom} {item.unit}</span>
                                <span>Custo: {formatCurrency(item.costPrice)}</span>
                                <span>Venda: {formatCurrency(item.price)}</span>
                                {item.linkedProductName && item.action === "link" && (
                                  <span className="text-primary">→ {item.linkedProductName}</span>
                                )}
                              </div>
                              {/* NCM Validation Alerts */}
                              {item.ncmErrors.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.ncmErrors.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[11px] text-destructive">
                                      <ShieldAlert className="w-3 h-3 shrink-0" />
                                      <span>{issue.message}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.ncmWarnings.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.ncmWarnings.map((issue, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>{issue.message}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => setEditingIndex(idx)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === "importing" && (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Importando produtos...</p>
          </div>
        )}

        <DialogFooter>
          {step === "review" && (
            <div className="flex gap-2 w-full justify-between">
              <Button variant="outline" onClick={reset}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                <Check className="w-4 h-4 mr-2" />
                Importar {selectedCount} item(ns)
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

function EditItemForm({
  item,
  existingProducts,
  onUpdate,
  onClose,
}: {
  item: ReviewItem;
  existingProducts: Product[];
  onUpdate: (updates: Partial<ReviewItem>) => void;
  onClose: () => void;
}) {
  const calcMargin = () => {
    if (item.costPrice > 0) return (((item.price - item.costPrice) / item.costPrice) * 100).toFixed(1);
    return "0.0";
  };
  const [marginStr, setMarginStr] = useState(calcMargin());
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Nome do Produto</Label>
          <Input
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Ação</Label>
          <Select
            value={item.action}
            onValueChange={(v: MatchAction) => {
              if (v === "create") {
                onUpdate({ action: "create", linkedProductId: null, linkedProductName: null });
              } else {
                onUpdate({ action: "link" });
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">Criar novo produto</SelectItem>
              <SelectItem value="link">Vincular a existente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {item.action === "link" && (
          <div className="md:col-span-2">
            <Label className="text-xs">Produto Existente</Label>
            <Select
              value={item.linkedProductId ?? ""}
              onValueChange={(id) => {
                const prod = existingProducts.find((p) => p.id === id);
                onUpdate({
                  linkedProductId: id,
                  linkedProductName: prod?.name ?? null,
                  name: prod?.name ?? item.name,
                  price: prod?.price ?? item.price,
                  unit: prod?.unit ?? item.unit,
                });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {existingProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.sku} ({formatCurrency(p.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-xs">Preço de Custo</Label>
          <Input
            type="number"
            step="0.01"
            value={item.costPrice}
            onChange={(e) => {
              const cost = parseFloat(e.target.value) || 0;
              const margin = parseFloat(marginStr) || 0;
              const newPrice = cost * (1 + margin / 100);
              onUpdate({ costPrice: cost, price: parseFloat(newPrice.toFixed(2)) });
            }}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Margem %</Label>
          <Input
            type="text"
            value={marginStr}
            onChange={(e) => {
              setMarginStr(e.target.value);
              const margin = parseFloat(e.target.value);
              if (!isNaN(margin) && item.costPrice > 0) {
                const newPrice = item.costPrice * (1 + margin / 100);
                onUpdate({ price: parseFloat(newPrice.toFixed(2)) });
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Preço de Venda</Label>
          <Input
            type="number"
            step="0.01"
            value={item.price}
            onChange={(e) => {
              const price = parseFloat(e.target.value) || 0;
              onUpdate({ price });
              if (item.costPrice > 0) {
                setMarginStr((((price - item.costPrice) / item.costPrice) * 100).toFixed(1));
              }
            }}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Unidade</Label>
          <Input
            value={item.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Categoria</Label>
          <Input
            value={item.category}
            onChange={(e) => onUpdate({ category: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Código de Barras</Label>
          <Input
            value={item.barcode}
            onChange={(e) => onUpdate({ barcode: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">NCM</Label>
          <Input
            value={item.ncm}
            onChange={(e) => onUpdate({ ncm: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          <Check className="w-3 h-3 mr-1" />
          Concluído
        </Button>
      </div>
    </div>
  );
}

// --- Helpers ---

function mapUnit(uCom: string): string {
  const map: Record<string, string> = {
    UN: "UN",
    KG: "KG",
    LT: "LT",
    CX: "CX",
    PCT: "PCT",
    MT: "MT",
    PC: "UN",
    UND: "UN",
    L: "LT",
    M: "MT",
  };
  return map[uCom.toUpperCase()] || uCom.toUpperCase();
}

function generateSKU(item: ReviewItem): string {
  const prefix = item.name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 6)
    .toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function formatCNPJ(cnpj: string): string {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}
