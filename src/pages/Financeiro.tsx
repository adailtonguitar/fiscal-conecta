import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Search, Filter, CheckCircle2, Clock, AlertTriangle, XCircle,
  ArrowDownCircle, ArrowUpCircle, MoreHorizontal, Trash2, Edit, CreditCard,
  TrendingUp, TrendingDown, Wallet, BarChart3, ChevronLeft, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFinancialEntries, useDeleteFinancialEntry, useMarkAsPaid, type FinancialEntry } from "@/hooks/useFinancialEntries";
import { FinancialEntryFormDialog } from "@/components/financial/FinancialEntryFormDialog";
import { CashFlowChart } from "@/components/financial/CashFlowChart";
import { DailyClosingDialog } from "@/components/financial/DailyClosingDialog";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", icon: Clock, variant: "secondary" },
  pago: { label: "Pago", icon: CheckCircle2, variant: "default" },
  vencido: { label: "Vencido", icon: AlertTriangle, variant: "destructive" },
  cancelado: { label: "Cancelado", icon: XCircle, variant: "outline" },
};

const categoryLabels: Record<string, string> = {
  fornecedor: "Fornecedor", aluguel: "Aluguel", energia: "Energia", agua: "Água",
  internet: "Internet", salario: "Salário", impostos: "Impostos", manutencao: "Manutenção",
  outros: "Outros", venda: "Venda", servico: "Serviço", comissao: "Comissão", reembolso: "Reembolso",
};

export default function Financeiro() {
  const now = new Date();
  const [month, setMonth] = useState(format(now, "yyyy-MM"));
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<FinancialEntry | null>(null);
  const [defaultType, setDefaultType] = useState<"pagar" | "receber">("pagar");
  const [deleteTarget, setDeleteTarget] = useState<FinancialEntry | null>(null);
  const [showClosing, setShowClosing] = useState(false);

  const typeFilter = tab === "pagar" ? "pagar" : tab === "receber" ? "receber" : undefined;
  const { data: entries = [], isLoading } = useFinancialEntries({
    type: typeFilter as any,
    startDate: `${month}-01`,
    endDate: `${month}-31`,
  });

  const { data: allEntries = [] } = useFinancialEntries({
    startDate: `${month}-01`,
    endDate: `${month}-31`,
  });

  const deleteEntry = useDeleteFinancialEntry();
  const markAsPaid = useMarkAsPaid();

  const filtered = entries.filter(
    (e) =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.counterpart && e.counterpart.toLowerCase().includes(search.toLowerCase()))
  );

  // Summaries
  const totalPagar = allEntries.filter(e => e.type === "pagar").reduce((s, e) => s + Number(e.amount), 0);
  const totalReceber = allEntries.filter(e => e.type === "receber").reduce((s, e) => s + Number(e.amount), 0);
  const totalPago = allEntries.filter(e => e.status === "pago" && e.type === "pagar").reduce((s, e) => s + Number(e.paid_amount || e.amount), 0);
  const totalRecebido = allEntries.filter(e => e.status === "pago" && e.type === "receber").reduce((s, e) => s + Number(e.paid_amount || e.amount), 0);
  const saldo = totalRecebido - totalPago;

  const prevMonth = () => {
    const d = parseISO(`${month}-01`);
    d.setMonth(d.getMonth() - 1);
    setMonth(format(d, "yyyy-MM"));
  };
  const nextMonth = () => {
    const d = parseISO(`${month}-01`);
    d.setMonth(d.getMonth() + 1);
    setMonth(format(d, "yyyy-MM"));
  };

  const handleNewEntry = (type: "pagar" | "receber") => {
    setDefaultType(type);
    setEditEntry(null);
    setShowForm(true);
  };

  const handleEdit = (entry: FinancialEntry) => {
    setEditEntry(entry);
    setShowForm(true);
  };

  const handleCloseForm = (open: boolean) => {
    setShowForm(open);
    if (!open) setEditEntry(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Contas a pagar, receber e fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowClosing(true)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Fechamento Diário
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleNewEntry("receber")}>
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            A Receber
          </Button>
          <Button size="sm" onClick={() => handleNewEntry("pagar")}>
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            A Pagar
          </Button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
          {format(parseISO(`${month}-01`), "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={TrendingDown} label="Total a Pagar" value={totalPagar} paid={totalPago} color="text-destructive" />
        <SummaryCard icon={TrendingUp} label="Total a Receber" value={totalReceber} paid={totalRecebido} color="text-primary" />
        <SummaryCard icon={Wallet} label="Saldo Realizado" value={saldo} color={saldo >= 0 ? "text-primary" : "text-destructive"} />
        <div className="bg-card rounded-xl border border-border p-4 card-shadow">
          <p className="text-xs text-muted-foreground mb-1">Lançamentos no mês</p>
          <p className="text-2xl font-bold text-foreground">{allEntries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {allEntries.filter(e => e.status === "pendente").length} pendentes
          </p>
        </div>
      </div>

      {/* Cash flow chart */}
      <CashFlowChart entries={allEntries} month={month} />

      {/* Entries list */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Tabs value={tab} onValueChange={setTab} className="flex-1">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pagar">A Pagar</TabsTrigger>
              <TabsTrigger value="receber">A Receber</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-5 py-3" colSpan={7}><Skeleton className="h-8 w-full" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      Nenhum lançamento encontrado neste período.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => {
                    const st = statusConfig[entry.status] || statusConfig.pendente;
                    const StIcon = st.icon;
                    return (
                      <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className={`flex items-center gap-2 ${entry.type === "pagar" ? "text-destructive" : "text-primary"}`}>
                            {entry.type === "pagar" ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                            <span className="text-xs font-medium">{entry.type === "pagar" ? "Pagar" : "Receber"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{entry.description}</p>
                          {entry.counterpart && <p className="text-xs text-muted-foreground">{entry.counterpart}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{categoryLabels[entry.category] || entry.category}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {format(parseISO(entry.due_date), "dd/MM/yyyy")}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold text-foreground">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={st.variant} className="text-xs gap-1">
                            <StIcon className="w-3 h-3" />
                            {st.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {entry.status === "pendente" && (
                                <DropdownMenuItem onClick={() => markAsPaid.mutate({ id: entry.id, paid_amount: entry.amount })}>
                                  <CreditCard className="w-4 h-4 mr-2" />Marcar como pago
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                <Edit className="w-4 h-4 mr-2" />Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(entry)}>
                                <Trash2 className="w-4 h-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Dialogs */}
      <FinancialEntryFormDialog
        key={editEntry?.id ?? "new"}
        open={showForm}
        onOpenChange={handleCloseForm}
        entry={editEntry}
        defaultType={defaultType}
      />

      <DailyClosingDialog open={showClosing} onOpenChange={setShowClosing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.description}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteEntry.mutate(deleteTarget.id); setDeleteTarget(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, paid, color }: { icon: any; label: string; value: number; paid?: number; color: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 card-shadow">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-bold font-mono ${color}`}>{formatCurrency(value)}</p>
      {paid !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">Realizado: {formatCurrency(paid)}</p>
      )}
    </div>
  );
}
