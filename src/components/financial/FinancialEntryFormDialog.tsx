import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateLocalFinancialEntry, useUpdateLocalFinancialEntry, type LocalFinancialEntry } from "@/hooks/useLocalFinancial";

const schema = z.object({
  type: z.enum(["pagar", "receber"]),
  category: z.enum(["fornecedor", "aluguel", "energia", "agua", "internet", "salario", "impostos", "manutencao", "outros", "venda", "servico", "comissao", "reembolso"]),
  description: z.string().trim().min(1, "Descrição obrigatória").max(300),
  amount: z.coerce.number().min(0.01, "Valor inválido"),
  due_date: z.string().min(1, "Data obrigatória"),
  counterpart: z.string().trim().max(200).optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
  payment_method: z.string().optional(),
  cost_center: z.string().trim().max(100).optional(),
});

const COST_CENTER_OPTIONS = [
  "Administrativo", "Comercial / Vendas", "Operacional", "Marketing",
  "Logística", "TI / Tecnologia", "RH / Pessoal", "Financeiro",
];

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: LocalFinancialEntry | null;
  defaultType?: "pagar" | "receber";
}

const categoryLabels: Record<string, string> = {
  fornecedor: "Fornecedor",
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  internet: "Internet",
  salario: "Salário",
  impostos: "Impostos",
  manutencao: "Manutenção",
  outros: "Outros",
  venda: "Venda",
  servico: "Serviço",
  comissao: "Comissão",
  reembolso: "Reembolso",
};

const payCategories = ["fornecedor", "aluguel", "energia", "agua", "internet", "salario", "impostos", "manutencao", "outros"];
const receiveCategories = ["venda", "servico", "comissao", "reembolso", "outros"];

export function FinancialEntryFormDialog({ open, onOpenChange, entry, defaultType = "pagar" }: Props) {
  const createEntry = useCreateLocalFinancialEntry();
  const updateEntry = useUpdateLocalFinancialEntry();
  const isEditing = !!entry;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (entry?.type as any) ?? defaultType,
      category: (entry?.category as any) ?? "outros",
      description: entry?.description ?? "",
      amount: entry?.amount ?? 0,
      due_date: entry?.due_date ?? new Date().toISOString().split("T")[0],
      counterpart: entry?.counterpart ?? "",
      reference: entry?.reference ?? "",
      notes: entry?.notes ?? "",
      payment_method: entry?.payment_method ?? "",
      cost_center: (entry as any)?.cost_center ?? "",
    },
  });

  const selectedType = form.watch("type");
  const cats = selectedType === "pagar" ? payCategories : receiveCategories;

  const onSubmit = async (data: FormData) => {
    if (isEditing && entry) {
      await updateEntry.mutateAsync({ id: entry.id, ...data } as any);
    } else {
      await createEntry.mutateAsync(data as any);
    }
    onOpenChange(false);
    form.reset();
  };

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pagar">Conta a Pagar</SelectItem>
                      <SelectItem value="receber">Conta a Receber</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {cats.map(c => <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Input placeholder="Descrição do lançamento" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="counterpart" render={({ field }) => (
              <FormItem>
                <FormLabel>{selectedType === "pagar" ? "Fornecedor / Credor" : "Cliente / Pagador"}</FormLabel>
                <FormControl><Input placeholder="Nome" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência</FormLabel>
                  <FormControl><Input placeholder="NF-12345" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="cost_center" render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo</FormLabel>
                <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} defaultValue={field.value || "none"}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {COST_CENTER_OPTIONS.map(cc => <SelectItem key={cc} value={cc}>{cc}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar Lançamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
