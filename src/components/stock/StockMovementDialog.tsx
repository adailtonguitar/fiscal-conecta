import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { supabase } from "@/integrations/supabase/client";
import type { LocalProduct } from "@/hooks/useLocalProducts";

const schema = z.object({
  type: z.enum(["entrada", "saida", "ajuste"]),
  quantity: z.coerce.number().min(0.01, "Quantidade inválida"),
  unit_cost: z.coerce.number().min(0).optional(),
  new_price: z.coerce.number().min(0).optional(),
  reason: z.string().trim().max(500).optional(),
  reference: z.string().trim().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LocalProduct;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  entrada: { label: "Entrada", color: "text-green-600" },
  saida: { label: "Saída", color: "text-red-600" },
  ajuste: { label: "Ajuste (definir estoque)", color: "text-blue-600" },
};

export function StockMovementDialog({ open, onOpenChange, product }: Props) {
  const createMovement = useCreateStockMovement();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "entrada",
      quantity: 0,
      unit_cost: 0,
      new_price: product.price ?? 0,
      reason: "",
      reference: "",
    },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (data: FormData) => {
    try {
      await createMovement.mutateAsync({
        product_id: product.id,
        type: data.type,
        quantity: data.quantity,
        unit_cost: data.unit_cost,
        reason: data.reason,
        reference: data.reference,
      });
      // Update price/cost if provided
      const updateFields: Record<string, unknown> = {};
      if (data.unit_cost && data.unit_cost > 0) updateFields.cost_price = data.unit_cost;
      if (data.new_price && data.new_price > 0) updateFields.price = data.new_price;
      if (Object.keys(updateFields).length > 0) {
        const { error } = await supabase.from("products").update(updateFields).eq("id", product.id);
        if (error) console.error("Erro ao atualizar preço:", error);
      }
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error(`Erro ao salvar: ${error?.message || "Tente novamente"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentação de Estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {product.name} — Estoque atual: <span className="font-mono font-semibold">{product.stock_quantity} {product.unit}</span>
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}><span className={v.color}>{v.label}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem>
                <FormLabel>{selectedType === "ajuste" ? "Novo Estoque" : "Quantidade"}</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {selectedType === "entrada" && (
              <>
                <FormField control={form.control} name="unit_cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Unitário (opcional)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="new_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (opcional)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder={String(product.price ?? 0)} {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Atual: R$ {(product.price ?? 0).toFixed(2)}</p>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            <FormField control={form.control} name="reference" render={({ field }) => (
              <FormItem>
                <FormLabel>Referência / NF (opcional)</FormLabel>
                <FormControl><Input placeholder="NF-12345" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Observação (opcional)</FormLabel>
                <FormControl><Textarea placeholder="Motivo da movimentação..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
