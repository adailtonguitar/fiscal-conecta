import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, X, User, CreditCard, Check, DollarSign } from "lucide-react";
import { useLocalClients } from "@/hooks/useLocalClients";
import { useLocalFinancialEntries, useMarkAsLocalPaid } from "@/hooks/useLocalFinancial";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CashSessionService } from "@/services/CashSessionService";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PDVCreditReceipt, type CreditReceiptData } from "./PDVCreditReceipt";

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
  const [customAmount, setCustomAmount] = useState(0); // in cents
  const [isProcessingDirect, setIsProcessingDirect] = useState(false);
  const [receiptData, setReceiptData] = useState<CreditReceiptData | null>(null);

  const { data: clients = [] } = useLocalClients();
  const { data: entries = [] } = useLocalFinancialEntries({ type: "receber" });
  const markAsPaid = useMarkAsLocalPaid();
  const { companyId, companyName, slogan } = useCompany();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Clients with pending credit (entries OR credit_balance > 0)
  const clientsWithDebt = useMemo(() => {
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
  const clientBalance = Number(selectedClient?.credit_balance || 0);

  const showReceipt = (amount: number, prevBalance: number) => {
    setReceiptData({
      clientName: selectedClient?.name || "",
      clientDoc: selectedClient?.cpf_cnpj || undefined,
      amount,
      previousBalance: prevBalance,
      newBalance: Math.max(0, prevBalance - amount),
      paymentMethod: selectedMethod,
      storeName: companyName || undefined,
      storeSlogan: slogan || undefined,
    });
  };

  const handleReceiveEntry = async (entryId: string, amount: number) => {
    setProcessingId(entryId);
    const prevBalance = clientBalance;
    try {
      await markAsPaid.mutateAsync({
        id: entryId,
        paid_amount: amount,
        payment_method: selectedMethod,
      });
      // Update client credit balance
      if (selectedClient) {
        const newBalance = Math.max(0, clientBalance - amount);
        await supabase.from("clients").update({ credit_balance: newBalance }).eq("id", selectedClient.id);
        qc.invalidateQueries({ queryKey: ["clients"] });
      }
      toast.success("Recebimento registrado no caixa!");
      showReceipt(amount, prevBalance);
    } catch {
      // error handled by hook
    } finally {
      setProcessingId(null);
    }
  };

  // Direct payment (no financial entry exists)
  const handleDirectReceive = async () => {
    const amount = customAmount; // CurrencyInput already returns decimal value
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (amount > clientBalance) {
      toast.error("Valor maior que o saldo devedor");
      return;
    }
    if (!companyId || !user || !selectedClient) return;

    const prevBalance = clientBalance;
    setIsProcessingDirect(true);
    try {
      const session = await CashSessionService.getCurrentSession(companyId);
      if (!session) {
        toast.error("Nenhum caixa aberto. Abra o caixa antes de receber.");
        return;
      }

      await supabase.from("cash_movements").insert({
        company_id: companyId,
        session_id: session.id,
        type: "suprimento" as any,
        amount,
        performed_by: user.id,
        payment_method: selectedMethod as any,
        description: `Recebimento fiado: ${selectedClient.name}`,
      });

      const paymentField = selectedMethod === "dinheiro" ? "total_dinheiro"
        : selectedMethod === "pix" ? "total_pix"
        : selectedMethod === "debito" ? "total_debito"
        : selectedMethod === "credito" ? "total_credito"
        : "total_outros";

      const { data: sessionData } = await supabase
        .from("cash_sessions")
        .select(`${paymentField}, total_suprimento`)
        .eq("id", session.id)
        .single();

      if (sessionData) {
        await supabase
          .from("cash_sessions")
          .update({
            [paymentField]: Number((sessionData as any)[paymentField] || 0) + amount,
            total_suprimento: Number(sessionData.total_suprimento || 0) + amount,
          })
          .eq("id", session.id);
      }

      const newBalance = Math.max(0, clientBalance - amount);
      await supabase.from("clients").update({ credit_balance: newBalance }).eq("id", selectedClient.id);

      await supabase.from("action_logs").insert({
        company_id: companyId,
        user_id: user.id,
        action: "recebimento_fiado",
        module: "pdv",
        details: `Recebido ${formatCurrency(amount)} de ${selectedClient.name} via ${selectedMethod}`,
      });

      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["cash_sessions"] });
      qc.invalidateQueries({ queryKey: ["cash_movements"] });

      toast.success(`Recebimento de ${formatCurrency(amount)} registrado!`);
      setCustomAmount(0);
      showReceipt(amount, prevBalance);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsProcessingDirect(false);
    }
  };

  const handleReceiveAll = async () => {
    for (const entry of clientEntries) {
      await handleReceiveEntry(entry.id, entry.amount);
    }
  };

  // Receive full balance directly
  const handleReceiveFullBalance = async () => {
    if (clientBalance <= 0) return;
    setCustomAmount(clientBalance);
    if (!companyId || !user || !selectedClient) return;

    const prevBalance = clientBalance;
    setIsProcessingDirect(true);
    try {
      const session = await CashSessionService.getCurrentSession(companyId);
      if (!session) {
        toast.error("Nenhum caixa aberto. Abra o caixa antes de receber.");
        return;
      }

      await supabase.from("cash_movements").insert({
        company_id: companyId,
        session_id: session.id,
        type: "suprimento" as any,
        amount: clientBalance,
        performed_by: user.id,
        payment_method: selectedMethod as any,
        description: `Recebimento fiado total: ${selectedClient.name}`,
      });

      const paymentField = selectedMethod === "dinheiro" ? "total_dinheiro"
        : selectedMethod === "pix" ? "total_pix"
        : selectedMethod === "debito" ? "total_debito"
        : selectedMethod === "credito" ? "total_credito"
        : "total_outros";

      const { data: sessionData } = await supabase
        .from("cash_sessions")
        .select(`${paymentField}, total_suprimento`)
        .eq("id", session.id)
        .single();

      if (sessionData) {
        await supabase
          .from("cash_sessions")
          .update({
            [paymentField]: Number((sessionData as any)[paymentField] || 0) + clientBalance,
            total_suprimento: Number(sessionData.total_suprimento || 0) + clientBalance,
          })
          .eq("id", session.id);
      }

      await supabase.from("clients").update({ credit_balance: 0 }).eq("id", selectedClient.id);

      await supabase.from("action_logs").insert({
        company_id: companyId,
        user_id: user.id,
        action: "recebimento_fiado",
        module: "pdv",
        details: `Recebido total ${formatCurrency(clientBalance)} de ${selectedClient.name} via ${selectedMethod}`,
      });

      for (const entry of clientEntries) {
        await markAsPaid.mutateAsync({ id: entry.id, paid_amount: entry.amount, payment_method: selectedMethod });
      }

      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["cash_sessions"] });
      qc.invalidateQueries({ queryKey: ["cash_movements"] });

      toast.success(`Recebimento total de ${formatCurrency(clientBalance)} registrado!`);
      showReceipt(clientBalance, prevBalance);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsProcessingDirect(false);
    }
  };

  if (!open) return null;

  if (receiptData) {
    return (
      <PDVCreditReceipt
        data={receiptData}
        onClose={() => {
          setReceiptData(null);
        }}
      />
    );
  }

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
                    onClick={() => { setSelectedClientId(client.id); setCustomAmount(0); }}
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
          /* Client detail */
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
                    Saldo devedor: <span className="font-mono text-destructive font-semibold">{formatCurrency(clientBalance)}</span>
                  </p>
                </div>
              </div>
              {clientBalance > 0 && (
                <button
                  onClick={handleReceiveFullBalance}
                  disabled={isProcessingDirect}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isProcessingDirect ? "Processando..." : "Receber Tudo"}
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Financial entries if any */}
              {clientEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parcelas pendentes</p>
                  {clientEntries.map((entry) => (
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
                          onClick={() => handleReceiveEntry(entry.id, entry.amount)}
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
                  ))}
                </div>
              )}

              {/* Direct payment input (always show when client has balance) */}
              {clientBalance > 0 && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {clientEntries.length > 0 ? "Ou receber valor avulso" : "Receber pagamento"}
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Valor a receber</label>
                      <CurrencyInput
                        value={customAmount}
                        onChange={setCustomAmount}
                        placeholder="0,00"
                        className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <button
                      onClick={handleDirectReceive}
                      disabled={isProcessingDirect || !customAmount}
                      className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isProcessingDirect ? (
                        <span className="animate-pulse">Processando...</span>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          Receber
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Máximo: {formatCurrency(clientBalance)}
                  </p>
                </div>
              )}

              {clientBalance <= 0 && clientEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Check className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm font-medium">Cliente sem débitos pendentes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
