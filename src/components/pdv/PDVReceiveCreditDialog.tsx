import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, User, CreditCard, Check, DollarSign } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useFinancialEntries, useMarkAsPaid } from "@/hooks/useFinancialEntries";
import { formatCurrency } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface PDVReceiveCreditDialogProps {
  open: boolean;
  onClose: () => void;
}

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
];

export function PDVReceiveCreditDialog({ open, onClose }: PDVReceiveCreditDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("dinheiro");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: clients = [] } = useClients();
  const { data: entries = [] } = useFinancialEntries({ type: "receber", status: "pendente" });
  const markAsPaid = useMarkAsPaid();

  // Clients with pending credit entries
  const clientsWithDebt = useMemo(() => {
    const debtMap = new Map<string, number>();
    entries.forEach((e) => {
      if (e.counterpart) {
        debtMap.set(e.counterpart, (debtMap.get(e.counterpart) || 0) + Number(e.amount));
      }
    });
    return clients
      .filter((c) => {
        const balance = Number(c.credit_balance || 0);
        const hasEntries = entries.some((e) => e.counterpart === c.name);
        return balance > 0 || hasEntries;
      })
      .filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.cpf_cnpj && c.cpf_cnpj.includes(search))
      );
  }, [clients, entries, search]);

  // Entries for selected client
  const clientEntries = useMemo(() => {
    if (!selectedClientId) return [];
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return [];
    return entries.filter((e) => e.counterpart === client.name);
  }, [entries, selectedClientId, clients]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleReceive = async (entryId: string, amount: number) => {
    setProcessingId(entryId);
    try {
      await markAsPaid.mutateAsync({
        id: entryId,
        paid_amount: amount,
        payment_method: selectedMethod,
      });
      toast.success("Recebimento registrado no caixa!");
    } catch {
      // error handled by hook
    } finally {
      setProcessingId(null);
    }
  };

  const handleReceiveAll = async () => {
    for (const entry of clientEntries) {
      await handleReceive(entry.id, entry.amount);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Receber Fiado</h2>
              <p className="text-xs text-muted-foreground">Receba pagamentos de vendas a prazo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedClientId ? (
          /* Client list */
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {clientsWithDebt.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <User className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Nenhum cliente com débito pendente</p>
                </div>
              ) : (
                clientsWithDebt.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.cpf_cnpj || "Sem documento"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-destructive">
                        {formatCurrency(Number(client.credit_balance || 0))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">em aberto</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Client detail with entries */
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Client header */}
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedClientId(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-sm font-bold text-foreground">{selectedClient?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Saldo devedor: <span className="font-mono text-destructive font-semibold">{formatCurrency(Number(selectedClient?.credit_balance || 0))}</span>
                  </p>
                </div>
              </div>
              {clientEntries.length > 1 && (
                <button
                  onClick={handleReceiveAll}
                  disabled={markAsPaid.isPending}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
                >
                  Receber Tudo
                </button>
              )}
            </div>

            {/* Payment method selector */}
            <div className="px-5 py-3 border-b border-border">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Forma de recebimento</label>
              <div className="flex gap-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMethod(m.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      selectedMethod === m.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entries list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {clientEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Check className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Nenhuma parcela pendente</p>
                </div>
              ) : (
                clientEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-muted/50 border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {format(parseISO(entry.due_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold font-mono text-foreground">
                        {formatCurrency(entry.amount)}
                      </p>
                      <button
                        onClick={() => handleReceive(entry.id, entry.amount)}
                        disabled={processingId === entry.id || markAsPaid.isPending}
                        className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {processingId === entry.id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <CreditCard className="w-3 h-3" />
                            Receber
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
