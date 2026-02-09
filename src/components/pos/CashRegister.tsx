import { useState } from "react";
import {
  DollarSign,
  Lock,
  Unlock,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

type CashView = "status" | "open" | "close" | "movement";

interface CashSessionData {
  isOpen: boolean;
  openingBalance: number;
  terminal: string;
  openedAt: string;
  salesCount: number;
  totalDinheiro: number;
  totalDebito: number;
  totalCredito: number;
  totalPix: number;
  totalSangria: number;
  totalSuprimento: number;
  totalVendas: number;
}

const mockSession: CashSessionData = {
  isOpen: true,
  openingBalance: 200,
  terminal: "Caixa 01",
  openedAt: new Date().toISOString(),
  salesCount: 12,
  totalDinheiro: 345.50,
  totalDebito: 289.90,
  totalCredito: 567.00,
  totalPix: 198.40,
  totalSangria: 200.00,
  totalSuprimento: 100.00,
  totalVendas: 1400.80,
};

interface CashRegisterProps {
  onClose: () => void;
}

export function CashRegister({ onClose }: CashRegisterProps) {
  const [view, setView] = useState<CashView>("status");
  const [session, setSession] = useState<CashSessionData>(mockSession);
  const [openingBalance, setOpeningBalance] = useState("200");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");
  const [movementType, setMovementType] = useState<"sangria" | "suprimento">("sangria");
  const [countedDinheiro, setCountedDinheiro] = useState("");
  const [countedDebito, setCountedDebito] = useState("");
  const [countedCredito, setCountedCredito] = useState("");
  const [countedPix, setCountedPix] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const expectedCash = session.openingBalance + session.totalDinheiro + session.totalSuprimento - session.totalSangria;

  const totalCounted = (Number(countedDinheiro) || 0) + (Number(countedDebito) || 0) + (Number(countedCredito) || 0) + (Number(countedPix) || 0);
  const totalExpected = session.totalDinheiro + session.totalDebito + session.totalCredito + session.totalPix + session.openingBalance + session.totalSuprimento - session.totalSangria;
  const difference = totalCounted - totalExpected;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl border border-border card-shadow w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Controle de Caixa</h3>
              <p className="text-xs text-muted-foreground">{session.terminal}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Status View */}
          {view === "status" && (
            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
              {/* Session status */}
              <div className={`flex items-center gap-3 p-4 rounded-xl ${session.isOpen ? "bg-success/10" : "bg-muted"}`}>
                {session.isOpen ? (
                  <>
                    <Unlock className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Caixa Aberto</p>
                      <p className="text-xs text-muted-foreground">
                        Desde {new Date(session.openedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Caixa Fechado</p>
                  </>
                )}
              </div>

              {session.isOpen && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Fundo Inicial</p>
                      <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(session.openingBalance)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Vendas</p>
                      <p className="text-lg font-bold font-mono text-primary">{formatCurrency(session.totalVendas)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Nº Vendas</p>
                      <p className="text-lg font-bold font-mono text-foreground">{session.salesCount}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Dinheiro Esperado</p>
                      <p className="text-lg font-bold font-mono text-foreground">{formatCurrency(expectedCash)}</p>
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Formas de Pagamento</p>
                    {[
                      { label: "Dinheiro", value: session.totalDinheiro, icon: Banknote },
                      { label: "Débito", value: session.totalDebito, icon: CreditCard },
                      { label: "Crédito", value: session.totalCredito, icon: CreditCard },
                      { label: "PIX", value: session.totalPix, icon: QrCode },
                    ].map((pm) => (
                      <div key={pm.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <pm.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{pm.label}</span>
                        </div>
                        <span className="font-mono font-semibold text-foreground">{formatCurrency(pm.value)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5">
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-foreground">Sangrias</span>
                      </div>
                      <span className="font-mono font-semibold text-destructive">-{formatCurrency(session.totalSangria)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-success/5">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-success" />
                        <span className="text-sm text-foreground">Suprimentos</span>
                      </div>
                      <span className="font-mono font-semibold text-success">+{formatCurrency(session.totalSuprimento)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setMovementType("sangria"); setView("movement"); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      Sangria
                    </button>
                    <button
                      onClick={() => { setMovementType("suprimento"); setView("movement"); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Suprimento
                    </button>
                    <button
                      onClick={() => setView("close")}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      Fechar Caixa
                    </button>
                  </div>
                </>
              )}

              {!session.isOpen && (
                <button
                  onClick={() => setView("open")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  Abrir Caixa
                </button>
              )}
            </motion.div>
          )}

          {/* Open Cash Register */}
          {view === "open" && (
            <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
              <h4 className="text-base font-semibold text-foreground">Abertura de Caixa</h4>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Fundo de Troco (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setView("status")} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                  Cancelar
                </button>
                <button
                  onClick={() => { setSession({ ...session, isOpen: true, openingBalance: Number(openingBalance) }); setView("status"); }}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Abrir Caixa
                </button>
              </div>
            </motion.div>
          )}

          {/* Cash Movement (sangria/suprimento) */}
          {view === "movement" && (
            <motion.div key="movement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
              <h4 className="text-base font-semibold text-foreground">
                {movementType === "sangria" ? "Sangria" : "Suprimento"}
              </h4>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Motivo</label>
                <input
                  type="text"
                  value={movementDesc}
                  onChange={(e) => setMovementDesc(e.target.value)}
                  placeholder="Ex: Troco para cliente, pagamento fornecedor..."
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setView("status")} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const amount = Number(movementAmount);
                    if (amount > 0) {
                      setSession((prev) => ({
                        ...prev,
                        ...(movementType === "sangria"
                          ? { totalSangria: prev.totalSangria + amount }
                          : { totalSuprimento: prev.totalSuprimento + amount }),
                      }));
                      setMovementAmount("");
                      setMovementDesc("");
                      setView("status");
                    }
                  }}
                  disabled={!movementAmount || Number(movementAmount) <= 0}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          )}

          {/* Close Cash Register */}
          {view === "close" && (
            <motion.div key="close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4">
              <h4 className="text-base font-semibold text-foreground">Fechamento de Caixa</h4>
              <p className="text-sm text-muted-foreground">Informe os valores conferidos:</p>

              <div className="space-y-3">
                {[
                  { label: "Dinheiro", expected: expectedCash, value: countedDinheiro, setter: setCountedDinheiro, icon: Banknote },
                  { label: "Débito", expected: session.totalDebito, value: countedDebito, setter: setCountedDebito, icon: CreditCard },
                  { label: "Crédito", expected: session.totalCredito, value: countedCredito, setter: setCountedCredito, icon: CreditCard },
                  { label: "PIX", expected: session.totalPix, value: countedPix, setter: setCountedPix, icon: QrCode },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-muted-foreground">Esperado: {formatCurrency(item.expected)}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={item.value}
                        onChange={(e) => item.setter(e.target.value)}
                        placeholder={formatCurrency(item.expected)}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Difference */}
              {totalCounted > 0 && (
                <div className={`flex justify-between items-center p-4 rounded-xl ${
                  Math.abs(difference) < 0.01 ? "bg-success/10" : Math.abs(difference) < 5 ? "bg-warning/10" : "bg-destructive/10"
                }`}>
                  <span className="text-sm font-medium text-foreground">Diferença</span>
                  <span className={`text-lg font-bold font-mono ${
                    Math.abs(difference) < 0.01 ? "text-success" : Math.abs(difference) < 5 ? "text-warning" : "text-destructive"
                  }`}>
                    {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Observações</label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Observações do fechamento..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setView("status")} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                  Voltar
                </button>
                <button
                  onClick={() => {
                    setSession((prev) => ({ ...prev, isOpen: false }));
                    setView("status");
                  }}
                  className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Confirmar Fechamento
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
