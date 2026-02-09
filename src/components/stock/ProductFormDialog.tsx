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

const schema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(200),
  sku: z.string().trim().min(1, "SKU obrigatório").max(50),
  ncm: z.string().trim().max(20).optional(),
  category: z.string().trim().max(50).optional(),
  unit: z.string().trim().min(1).max(10),
  price: z.coerce.number().min(0, "Preço inválido"),
  cost_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0),
  min_stock: z.coerce.number().min(0).optional(),
  barcode: z.string().trim().max(50).optional(),
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
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEditing = !!product;
  const initialMargin = product && product.cost_price && product.cost_price > 0
    ? ((product.price - product.cost_price) / product.cost_price) * 100
    : null;
  const [marginStr, setMarginStr] = useState<string>(initialMargin !== null ? initialMargin.toFixed(1) : "");

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
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing && product) {
      await updateProduct.mutateAsync({ id: product.id, ...data });
    } else {
      await createProduct.mutateAsync({ name: data.name, sku: data.sku, ...data });
    }
    onOpenChange(false);
    form.reset();
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>NCM</FormLabel>
                  <FormControl><Input placeholder="22021000" {...field} /></FormControl>
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
