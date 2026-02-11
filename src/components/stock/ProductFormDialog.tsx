import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateProduct, useUpdateProduct, type Product } from "@/hooks/useProducts";
import { useFiscalCategories } from "@/hooks/useFiscalCategories";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface NCMSuggestion {
  ncm: string;
  description: string;
}

const schema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(200),
  sku: z.string().trim().max(50).optional().or(z.literal("")),
  ncm: z.string().trim().max(20).optional(),
  category: z.string().trim().max(50).optional(),
  unit: z.string().trim().min(1).max(10),
  price: z.coerce.number().min(0, "Preço inválido"),
  cost_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0),
  min_stock: z.coerce.number().min(0).optional(),
  barcode: z.string().trim().max(50).optional(),
  fiscal_category_id: z.string().uuid().optional().or(z.literal("")),
  origem: z.coerce.number().min(0).max(8).optional(),
  cfop: z.string().trim().max(10).optional(),
  cest: z.string().trim().max(10).optional(),
  csosn: z.string().trim().max(10).optional(),
  cst_icms: z.string().trim().max(10).optional(),
  aliq_icms: z.coerce.number().min(0).optional(),
  cst_pis: z.string().trim().max(10).optional(),
  aliq_pis: z.coerce.number().min(0).optional(),
  cst_cofins: z.string().trim().max(10).optional(),
  aliq_cofins: z.coerce.number().min(0).optional(),
  gtin_tributavel: z.string().trim().max(20).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

const categories = ["Bebidas", "Alimentos", "Limpeza", "Higiene", "Hortifrúti", "Padaria", "Frios", "Outros"];
const units = ["UN", "KG", "LT", "MT", "CX", "PCT"];

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const { data: fiscalCategories = [] } = useFiscalCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;
  const initialMargin = product && product.cost_price && product.cost_price > 0
    ? ((product.price - product.cost_price) / product.cost_price) * 100
    : null;
  const [marginStr, setMarginStr] = useState<string>(initialMargin !== null ? initialMargin.toFixed(1) : "");
  const [ncmSuggestions, setNcmSuggestions] = useState<NCMSuggestion[]>([]);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [showNcmSuggestions, setShowNcmSuggestions] = useState(false);

  const lookupNCM = async () => {
    const productName = form.getValues("name");
    if (!productName || productName.trim().length < 2) {
      toast.error("Digite o nome do produto primeiro");
      return;
    }
    setNcmLoading(true);
    setNcmSuggestions([]);
    setShowNcmSuggestions(false);
    try {
      const { data, error } = await supabase.functions.invoke("ncm-lookup", {
        body: { productName: productName.trim() },
      });
      if (error) throw error;
      if (data?.suggestions && data.suggestions.length > 0) {
        setNcmSuggestions(data.suggestions);
        setShowNcmSuggestions(true);
      } else {
        toast.info("Nenhuma sugestão de NCM encontrada");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar NCM");
    } finally {
      setNcmLoading(false);
    }
  };

  const selectNCM = (ncm: string) => {
    form.setValue("ncm", ncm);
    setShowNcmSuggestions(false);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      ncm: product?.ncm ?? "",
      category: product?.category ?? "",
      unit: product?.unit ?? "UN",
      price: product?.price ?? 0,
      cost_price: product?.cost_price ?? 0,
      stock_quantity: product?.stock_quantity ?? 0,
      min_stock: product?.min_stock ?? 0,
      barcode: product?.barcode ?? "",
      fiscal_category_id: (product as any)?.fiscal_category_id ?? "",
      origem: (product as any)?.origem ?? 0,
      cfop: (product as any)?.cfop ?? "5102",
      cest: (product as any)?.cest ?? "",
      csosn: (product as any)?.csosn ?? "102",
      cst_icms: (product as any)?.cst_icms ?? "00",
      aliq_icms: (product as any)?.aliq_icms ?? 0,
      cst_pis: (product as any)?.cst_pis ?? "01",
      aliq_pis: (product as any)?.aliq_pis ?? 1.65,
      cst_cofins: (product as any)?.cst_cofins ?? "01",
      aliq_cofins: (product as any)?.aliq_cofins ?? 7.60,
      gtin_tributavel: (product as any)?.gtin_tributavel ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      fiscal_category_id: data.fiscal_category_id || null,
    };
    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, ...payload } as any);
    } else {
      await createProduct.mutateAsync({ name: payload.name, sku: payload.sku, ...payload } as any);
    }
    onOpenChange(false);
    form.reset();
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input placeholder="Nome do produto" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl><Input placeholder="BEB001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="barcode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras</FormLabel>
                  <FormControl><Input placeholder="7891234567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="ncm" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    NCM
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] gap-1 text-primary hover:text-primary"
                      onClick={lookupNCM}
                      disabled={ncmLoading}
                    >
                      {ncmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Buscar por IA
                    </Button>
                  </FormLabel>
                  <FormControl><Input placeholder="22021000" {...field} /></FormControl>
                  {showNcmSuggestions && ncmSuggestions.length > 0 && (
                    <div className="mt-1 border border-border rounded-lg overflow-hidden bg-popover shadow-lg">
                      {ncmSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectNCM(s.ncm)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors border-b border-border last:border-0"
                        >
                          <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-mono font-medium text-foreground">{s.ncm}</span>
                          <span className="text-muted-foreground text-xs truncate">— {s.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="cost_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Custo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const cost = parseFloat(e.target.value) || 0;
                        const price = form.getValues("price");
                        if (cost > 0 && price > 0) {
                          setMarginStr((((price - cost) / cost) * 100).toFixed(1));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Venda</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const price = parseFloat(e.target.value) || 0;
                        const cost = form.getValues("cost_price") || 0;
                        if (cost > 0 && price > 0) {
                          setMarginStr((((price - cost) / cost) * 100).toFixed(1));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Margem %</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={marginStr}
                  className={(() => {
                    const m = parseFloat(marginStr);
                    if (isNaN(m)) return "";
                    return m > 0 ? "text-green-600 font-semibold" : m < 0 ? "text-destructive font-semibold" : "";
                  })()}
                  onChange={(e) => {
                    setMarginStr(e.target.value);
                    const m = parseFloat(e.target.value);
                    const cost = form.getValues("cost_price") || 0;
                    if (!isNaN(m) && cost > 0) {
                      const newPrice = +(cost * (1 + m / 100)).toFixed(2);
                      form.setValue("price", newPrice);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stock_quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Atual</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="min_stock" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Mínimo</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Categoria Fiscal */}
            <FormField control={form.control} name="fiscal_category_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria Fiscal</FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v === "__none__" ? "" : v);
                    // Auto-fill ALL fiscal fields from selected category
                    if (v && v !== "__none__") {
                      const cat = fiscalCategories.find(c => c.id === v) as any;
                      if (cat) {
                        form.setValue("cfop", cat.cfop || "5102");
                        form.setValue("csosn", cat.csosn || "");
                        form.setValue("cst_icms", cat.cst_icms || "");
                        form.setValue("aliq_icms", cat.icms_rate ?? 0);
                        form.setValue("aliq_pis", cat.pis_rate ?? 1.65);
                        form.setValue("aliq_cofins", cat.cofins_rate ?? 7.60);
                        if (cat.cest) form.setValue("cest", cat.cest);
                        if (cat.ncm) form.setValue("ncm", cat.ncm);
                      }
                    }
                  }}
                  defaultValue={field.value || "__none__"}
                >
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecione uma categoria fiscal" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {fiscalCategories.filter((c: any) => c.is_active).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.cfop} - {c.operation_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Dados Fiscais */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Dados Fiscais (NF-e)</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="origem" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value ?? 0)}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="0">0 - Nacional</SelectItem>
                        <SelectItem value="1">1 - Estrangeira (importação direta)</SelectItem>
                        <SelectItem value="2">2 - Estrangeira (mercado interno)</SelectItem>
                        <SelectItem value="3">3 - Nacional (import. 40-70%)</SelectItem>
                        <SelectItem value="5">5 - Nacional (import. &lt;40%)</SelectItem>
                        <SelectItem value="6">6 - Estrangeira (sem similar)</SelectItem>
                        <SelectItem value="7">7 - Estrangeira (com similar)</SelectItem>
                        <SelectItem value="8">8 - Nacional (import. &gt;70%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cfop" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CFOP</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "5102"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="5101">5101 - Venda prod. estab.</SelectItem>
                        <SelectItem value="5102">5102 - Venda merc. adquirida</SelectItem>
                        <SelectItem value="5103">5103 - Venda prod. c/ ST</SelectItem>
                        <SelectItem value="5405">5405 - Venda merc. c/ ST</SelectItem>
                        <SelectItem value="5403">5403 - Venda prod. ST</SelectItem>
                        <SelectItem value="5949">5949 - Outra saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cest" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEST</FormLabel>
                    <FormControl><Input placeholder="0300100" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <FormField control={form.control} name="csosn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSOSN (Simples)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "102"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="101">101 - Tributada com permissão de crédito</SelectItem>
                        <SelectItem value="102">102 - Tributada sem permissão de crédito</SelectItem>
                        <SelectItem value="103">103 - Isenção de ICMS (faixa)</SelectItem>
                        <SelectItem value="201">201 - Tributada c/ ST e crédito</SelectItem>
                        <SelectItem value="202">202 - Tributada c/ ST sem crédito</SelectItem>
                        <SelectItem value="300">300 - Imune</SelectItem>
                        <SelectItem value="400">400 - Não tributada</SelectItem>
                        <SelectItem value="500">500 - ICMS ST anterior</SelectItem>
                        <SelectItem value="900">900 - Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cst_icms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CST ICMS</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "00"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="00">00 - Tributada integralmente</SelectItem>
                        <SelectItem value="10">10 - Tributada com ST</SelectItem>
                        <SelectItem value="20">20 - Com redução de BC</SelectItem>
                        <SelectItem value="30">30 - Isenta c/ ST</SelectItem>
                        <SelectItem value="40">40 - Isenta</SelectItem>
                        <SelectItem value="41">41 - Não tributada</SelectItem>
                        <SelectItem value="50">50 - Suspensão</SelectItem>
                        <SelectItem value="51">51 - Diferimento</SelectItem>
                        <SelectItem value="60">60 - ICMS ST anterior</SelectItem>
                        <SelectItem value="70">70 - Redução BC c/ ST</SelectItem>
                        <SelectItem value="90">90 - Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="aliq_icms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíq. ICMS %</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4 mt-3">
                <FormField control={form.control} name="cst_pis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CST PIS</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "01"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="01">01 - Tributável (BC = Valor)</SelectItem>
                        <SelectItem value="02">02 - Tributável (BC = Quant.)</SelectItem>
                        <SelectItem value="04">04 - Monofásica (zero)</SelectItem>
                        <SelectItem value="05">05 - ST (zero)</SelectItem>
                        <SelectItem value="06">06 - Alíquota zero</SelectItem>
                        <SelectItem value="07">07 - Isenta</SelectItem>
                        <SelectItem value="08">08 - Sem incidência</SelectItem>
                        <SelectItem value="09">09 - Suspensão</SelectItem>
                        <SelectItem value="49">49 - Outras operações</SelectItem>
                        <SelectItem value="99">99 - Outras operações</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="aliq_pis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíq. PIS %</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cst_cofins" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CST COFINS</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "01"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="01">01 - Tributável (BC = Valor)</SelectItem>
                        <SelectItem value="02">02 - Tributável (BC = Quant.)</SelectItem>
                        <SelectItem value="04">04 - Monofásica (zero)</SelectItem>
                        <SelectItem value="05">05 - ST (zero)</SelectItem>
                        <SelectItem value="06">06 - Alíquota zero</SelectItem>
                        <SelectItem value="07">07 - Isenta</SelectItem>
                        <SelectItem value="08">08 - Sem incidência</SelectItem>
                        <SelectItem value="09">09 - Suspensão</SelectItem>
                        <SelectItem value="49">49 - Outras operações</SelectItem>
                        <SelectItem value="99">99 - Outras operações</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="aliq_cofins" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alíq. COFINS %</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="mt-3">
                <FormField control={form.control} name="gtin_tributavel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GTIN Tributável</FormLabel>
                    <FormControl><Input placeholder="EAN tributável (se diferente do código de barras)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
