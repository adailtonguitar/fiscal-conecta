import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateDailyClosing, useDailyClosings } from "@/hooks/useDailyClosings";
import { formatCurrency } from "@/lib/mock-data";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyClosingDialog({ open, onOpenChange }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [closingDate, setClosingDate] = useState(today);
  const [form, setForm] = useState({
    total_sales: 0,
    total_receivables: 0,
    total_payables: 0,
    cash_balance: 0,
    total_dinheiro: 0,
    total_debito: 0,
    total_credito: 0,
    total_pix: 0,
    total_outros: 0,
    notes: "",
  });

  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: closings = [], isLoading } = useDailyClosings(currentMonth);
  const createClosing = useCreateDailyClosing();

  const handleSave = async () => {
    await createClosing.mutateAsync({ ...form, closing_date: closingDate });
    setForm({ total_sales: 0, total_receivables: 0, total_payables: 0, cash_balance: 0, total_dinheiro: 0, total_debito: 0, total_credito: 0, total_pix: 0, total_outros: 0, notes: "" });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fechamento Diário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* New closing form */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="w-40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Total Vendas</Label>
                <Input type="number" step="0.01" value={form.total_sales} onChange={(e) => updateField("total_sales", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Saldo Caixa</Label>
                <Input type="number" step="0.01" value={form.cash_balance} onChange={(e) => updateField("cash_balance", e.target.value)} />
              </div>
            </div>

            <p className="text-xs font-medium text-muted-foreground">Totais por forma de pagamento</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "total_dinheiro", label: "Dinheiro" },
                { key: "total_debito", label: "Débito" },
                { key: "total_credito", label: "Crédito" },
                { key: "total_pix", label: "PIX" },
                { key: "total_outros", label: "Outros" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" step="0.01" value={(form as any)[key]} onChange={(e) => updateField(key, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Total a Receber</Label>
                <Input type="number" step="0.01" value={form.total_receivables} onChange={(e) => updateField("total_receivables", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Total a Pagar</Label>
                <Input type="number" step="0.01" value={form.total_payables} onChange={(e) => updateField("total_payables", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>

            <Button onClick={handleSave} disabled={createClosing.isPending} className="w-full">
              {createClosing.isPending ? "Salvando..." : "Registrar Fechamento"}
            </Button>
          </div>

          {/* History */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Fechamentos Recentes</h4>
            {isLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : closings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum fechamento registrado.</p>
            ) : (
              <div className="divide-y divide-border">
                {closings.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(c.closing_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vendas: {formatCurrency(c.total_sales ?? 0)} • Saldo: {formatCurrency(c.cash_balance ?? 0)}
                      </p>
                    </div>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {formatCurrency((c.total_receivables ?? 0) - (c.total_payables ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
