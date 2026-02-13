import { useState, useEffect, useMemo } from "react";
import { Search, User, X, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export interface CreditClient {
  id: string;
  name: string;
  cpf_cnpj: string | null;
  phone: string | null;
  credit_limit: number;
  credit_balance: number;
}

interface PDVClientSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (client: CreditClient, mode: "fiado" | "parcelado", installments: number) => void;
  saleTotal: number;
}

export function PDVClientSelector({ open, onClose, onSelect, saleTotal }: PDVClientSelectorProps) {
  const { companyId } = useCompany();
  const [clients, setClients] = useState<CreditClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<CreditClient | null>(null);
  const [mode, setMode] = useState<"fiado" | "parcelado">("fiado");
  const [installments, setInstallments] = useState(2);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [checkingOverdue, setCheckingOverdue] = useState(false);
  // Map client_id -> has overdue (for list badges)
  const [overdueClients, setOverdueClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !companyId) return;
    setLoading(true);
    setSelectedClient(null);
    setOverdueCount(0);
    setOverdueTotal(0);

    const loadData = async () => {
      const [clientsRes, overdueRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, cpf_cnpj, phone, credit_limit, credit_balance")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("name"),
        // Get all overdue receivables linked to clients
        supabase
          .from("financial_entries")
          .select("counterpart, amount")
          .eq("company_id", companyId)
          .eq("type", "receber")
          .eq("status", "pendente")
          .lt("due_date", new Date().toISOString().slice(0, 10)),
      ]);

      setClients((clientsRes.data as CreditClient[]) || []);

      // Build set of client names with overdue entries
      const overdueSet = new Set<string>();
      if (overdueRes.data) {
        for (const entry of overdueRes.data) {
          if (entry.counterpart) {
            overdueSet.add(entry.counterpart);
          }
        }
      }
      setOverdueClients(overdueSet);
      setLoading(false);
    };

    loadData();
  }, [open, companyId]);

  // Check overdue for selected client
  useEffect(() => {
    if (!selectedClient || !companyId) {
      setOverdueCount(0);
      setOverdueTotal(0);
      return;
    }

    setCheckingOverdue(true);
    supabase
      .from("financial_entries")
      .select("id, amount, due_date")
      .eq("company_id", companyId)
      .eq("type", "receber")
      .eq("status", "pendente")
      .eq("counterpart", selectedClient.name)
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .then(({ data }) => {
        const entries = data || [];
        setOverdueCount(entries.length);
        setOverdueTotal(entries.reduce((sum, e) => sum + Number(e.amount), 0));
        setCheckingOverdue(false);
      });
  }, [selectedClient, companyId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cpf_cnpj && c.cpf_cnpj.includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [clients, search]);

  const availableCredit = selectedClient
    ? selectedClient.credit_limit - selectedClient.credit_balance
    : 0;
  const hasEnoughCredit = selectedClient
    ? selectedClient.credit_limit === 0 || availableCredit >= saleTotal
    : false;
  const creditBlocked = selectedClient
    ? selectedClient.credit_limit > 0 && availableCredit < saleTotal
    : false;
  const hasOverdue = overdueCount > 0;

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Venda a Prazo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {!selectedClient ? (
          /* Client search & list */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar cliente por nome, CPF/CNPJ..."
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum cliente encontrado</p>
              ) : (
                filtered.map((client) => {
                  const available = client.credit_limit > 0 ? client.credit_limit - client.credit_balance : null;
                  const clientHasOverdue = overdueClients.has(client.name);
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        clientHasOverdue ? "bg-destructive/10" : "bg-primary/10"
                      }`}>
                        {clientHasOverdue ? (
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {client.cpf_cnpj || "Sem documento"}{" "}
                          {clientHasOverdue && (
                            <span className="text-destructive font-bold">• INADIMPLENTE</span>
                          )}
                          {!clientHasOverdue && client.credit_balance > 0 && (
                            <span className="text-warning">• Devendo {formatCurrency(client.credit_balance)}</span>
                          )}
                        </p>
                      </div>
                      {available !== null && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-muted-foreground uppercase">Limite</p>
                          <p className={`text-xs font-bold ${available >= saleTotal ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(available)}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Client selected — choose mode */
          <div className="p-5 space-y-4">
            {/* Client info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{selectedClient.name}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.cpf_cnpj || "Sem documento"}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-xs text-primary hover:underline"
              >
                Trocar
              </button>
            </div>

            {/* Credit info */}
            {selectedClient.credit_limit > 0 && (
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-muted text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Limite</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(selectedClient.credit_limit)}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-muted text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Em uso</p>
                  <p className="text-sm font-bold text-warning">{formatCurrency(selectedClient.credit_balance)}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-muted text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Disponível</p>
                  <p className={`text-sm font-bold ${availableCredit >= saleTotal ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(availableCredit)}
                  </p>
                </div>
              </div>
            )}

            {/* Overdue block */}
            {hasOverdue && !checkingOverdue && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-sm font-bold text-destructive">Cliente inadimplente</p>
                </div>
                <p className="text-xs text-destructive/80">
                  Este cliente possui {overdueCount} conta{overdueCount !== 1 ? "s" : ""} vencida{overdueCount !== 1 ? "s" : ""} totalizando{" "}
                  <span className="font-bold">{formatCurrency(overdueTotal)}</span>. 
                  Novas vendas a prazo estão bloqueadas até a regularização.
                </p>
              </div>
            )}

            {creditBlocked && !hasOverdue && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-sm font-medium text-destructive">
                  Limite de crédito insuficiente para esta venda ({formatCurrency(saleTotal)})
                </p>
              </div>
            )}

            {!creditBlocked && !hasOverdue && !checkingOverdue && (
              <>
                {/* Mode selection */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Tipo de venda a prazo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("fiado")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        mode === "fiado"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 ${mode === "fiado" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${mode === "fiado" ? "text-primary" : "text-foreground"}`}>
                        Fiado
                      </span>
                      <span className="text-[10px] text-muted-foreground">Conta única</span>
                    </button>
                    <button
                      onClick={() => setMode("parcelado")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        mode === "parcelado"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <Calendar className={`w-6 h-6 ${mode === "parcelado" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${mode === "parcelado" ? "text-primary" : "text-foreground"}`}>
                        Parcelado
                      </span>
                      <span className="text-[10px] text-muted-foreground">Múltiplas parcelas</span>
                    </button>
                  </div>
                </div>

                {/* Installments selector for parcelado */}
                {mode === "parcelado" && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Parcelas</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                        <button
                          key={n}
                          onClick={() => setInstallments(n)}
                          className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                            installments === n
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-accent"
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {installments}x de {formatCurrency(saleTotal / installments)}
                    </p>
                  </div>
                )}

                {/* Confirm */}
                <button
                  onClick={() => onSelect(selectedClient, mode, mode === "parcelado" ? installments : 1)}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all uppercase tracking-wider"
                >
                  Confirmar Venda a Prazo — {formatCurrency(saleTotal)}
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
