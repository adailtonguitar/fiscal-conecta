import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Ticket,
  MoreHorizontal,
  Plus,
  Split,
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

type PaymentStep = "select" | "amount" | "details" | "processing" | "result" | "summary";
type PaymentMethodType = "dinheiro" | "debito" | "credito" | "pix" | "voucher" | "outros";

interface TEFProcessorProps {
  total: number;
  onComplete: (results: TEFResult[]) => void;
  onCancel: () => void;
}

export interface TEFResult {
  method: PaymentMethodType;
  approved: boolean;
  amount: number;
  nsu?: string;
  authCode?: string;
  cardBrand?: string;
  cardLastDigits?: string;
  installments?: number;
  changeAmount?: number;
  pixTxId?: string;
}

const paymentMethods = [
  { id: "dinheiro" as const, label: "Dinheiro", icon: Banknote, color: "bg-success/10 text-success" },
  { id: "debito" as const, label: "Cartão Débito", icon: CreditCard, color: "bg-blue-500/10 text-blue-500" },
  { id: "credito" as const, label: "Cartão Crédito", icon: CreditCard, color: "bg-purple-500/10 text-purple-500" },
  { id: "pix" as const, label: "PIX", icon: QrCode, color: "bg-teal-500/10 text-teal-500" },
  { id: "voucher" as const, label: "Voucher", icon: Ticket, color: "bg-amber-500/10 text-amber-500" },
  { id: "outros" as const, label: "Outros", icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500" },
];

const cardBrands = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

const tefSteps = [
  { status: "Iniciando TEF...", duration: 800 },
  { status: "Conectando ao pinpad...", duration: 1200 },
  { status: "Aguardando cartão...", duration: 1500 },
  { status: "Lendo cartão...", duration: 800 },
  { status: "Aguardando senha...", duration: 2000 },
  { status: "Processando transação...", duration: 1500 },
  { status: "Comunicando com adquirente...", duration: 1200 },
];

const pixSteps = [
  { status: "Gerando QR Code PIX...", duration: 1000 },
  { status: "Aguardando pagamento...", duration: 3000 },
  { status: "Verificando transferência...", duration: 1500 },
];

const generateNSU = () => String(Math.floor(Math.random() * 999999999)).padStart(9, "0");
const generateAuthCode = () => String(Math.floor(Math.random() * 999999)).padStart(6, "0");
const generatePixTxId = () => `E${String(Math.floor(Math.random() * 99999999999)).padStart(32, "0")}`;

export function TEFProcessor({ total, onComplete, onCancel }: TEFProcessorProps) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [isSplit, setIsSplit] = useState(false);
  const [completedPayments, setCompletedPayments] = useState<TEFResult[]>([]);
  const [currentAmount, setCurrentAmount] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [installments, setInstallments] = useState(1);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [currentResult, setCurrentResult] = useState<TEFResult | null>(null);

  const paidSoFar = completedPayments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, Number((total - paidSoFar).toFixed(2)));
  const paymentAmount = isSplit && currentAmount ? Number(currentAmount) : remaining;

  const changeAmount = method === "dinheiro" && cashReceived ? Number(cashReceived) - paymentAmount : 0;

  const processPayment = useCallback(async (amt: number) => {
    if (!method) return;
    setStep("processing");

    const steps = method === "pix" ? pixSteps : method === "dinheiro" ? [] : tefSteps;

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      setProcessingStatus(steps[i].status);
      await new Promise((r) => setTimeout(r, steps[i].duration));
    }

    const approved = Math.random() > 0.05;
    const brand = cardBrands[Math.floor(Math.random() * cardBrands.length)];

    const tefResult: TEFResult = {
      method,
      approved,
      amount: amt,
      nsu: approved ? generateNSU() : undefined,
      authCode: approved ? generateAuthCode() : undefined,
      cardBrand: method === "debito" || method === "credito" ? brand : undefined,
      cardLastDigits: method === "debito" || method === "credito" ? String(Math.floor(Math.random() * 9999)).padStart(4, "0") : undefined,
      installments: method === "credito" ? installments : undefined,
      changeAmount: method === "dinheiro" ? (cashReceived ? Number(cashReceived) - amt : 0) : undefined,
      pixTxId: method === "pix" ? generatePixTxId() : undefined,
    };

    setCurrentResult(tefResult);
    setStep("result");
  }, [method, installments, cashReceived]);

  const handleSelectMethod = (m: PaymentMethodType) => {
    setMethod(m);
    setInstallments(1);
    setCashReceived("");

    if (isSplit) {
      // In split mode, always ask for amount first (except if it's the last remaining)
      setStep("amount");
    } else {
      // Single payment mode — full amount
      if (m === "dinheiro" || m === "credito") {
        setStep("details");
      } else if (m === "voucher" || m === "outros") {
        const tefResult: TEFResult = { method: m, approved: true, amount: remaining, nsu: generateNSU() };
        setCurrentResult(tefResult);
        setStep("result");
      } else {
        processPayment(remaining);
      }
    }
  };

  const handleConfirmAmount = () => {
    const amt = Number(currentAmount);
    if (!amt || amt <= 0 || amt > remaining) return;

    if (method === "dinheiro" || method === "credito") {
      setStep("details");
    } else if (method === "voucher" || method === "outros") {
      const tefResult: TEFResult = { method: method!, approved: true, amount: amt, nsu: generateNSU() };
      setCurrentResult(tefResult);
      setStep("result");
    } else {
      processPayment(amt);
    }
  };

  const handleConfirmDetails = () => {
    const amt = isSplit ? Number(currentAmount) || remaining : remaining;

    if (method === "dinheiro") {
      const received = Number(cashReceived);
      if (received < amt) return;
      const tefResult: TEFResult = {
        method: "dinheiro",
        approved: true,
        amount: amt,
        changeAmount: received - amt,
      };
      setCurrentResult(tefResult);
      setStep("result");
    } else {
      processPayment(amt);
    }
  };

  const handlePaymentApproved = () => {
    if (!currentResult || !currentResult.approved) return;

    const newCompleted = [...completedPayments, currentResult];
    setCompletedPayments(newCompleted);

    const newPaid = newCompleted.reduce((s, p) => s + p.amount, 0);
    const newRemaining = Number((total - newPaid).toFixed(2));

    if (newRemaining <= 0) {
      // All paid — go to summary
      onComplete(newCompleted);
    } else {
      // More to pay — go back to select
      setMethod(null);
      setCurrentAmount("");
      setCashReceived("");
      setCurrentResult(null);
      setStep("select");
    }
  };

  const handleRetry = () => {
    setCurrentResult(null);
    setStep("select");
  };

  const enableSplit = () => {
    setIsSplit(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-pos-bg/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-pos-surface border border-pos-border rounded-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-pos-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-pos-text">
                {isSplit ? "Pagamento Misto" : "Pagamento"}
              </h3>
              <p className="pos-price text-xl mt-0.5">{formatCurrency(total)}</p>
            </div>
            {step !== "processing" && (
              <button
                onClick={step === "select" && completedPayments.length === 0 ? onCancel : () => {
                  if (step === "select" && completedPayments.length > 0) {
                    // Can't go back once partial payments are made
                    return;
                  }
                  setStep("select");
                  setCurrentResult(null);
                }}
                className="p-2 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-bg transition-colors"
              >
                {step === "select" && completedPayments.length === 0 ? (
                  <XCircle className="w-5 h-5" />
                ) : step !== "select" ? (
                  <ArrowLeft className="w-5 h-5" />
                ) : null}
              </button>
            )}
          </div>

          {/* Split payment progress bar */}
          {isSplit && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-pos-text-muted">Pago: {formatCurrency(paidSoFar)}</span>
                <span className="text-pos-accent font-medium">Restante: {formatCurrency(remaining)}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-pos-bg overflow-hidden">
                <div
                  className="h-full rounded-full bg-pos-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, (paidSoFar / total) * 100)}%` }}
                />
              </div>
              {completedPayments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {completedPayments.map((p, i) => {
                    const pm = paymentMethods.find((m) => m.id === p.method);
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pos-bg text-xs text-pos-text-muted">
                        {pm?.label}: {formatCurrency(p.amount)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Step: Select payment method */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-3"
            >
              <p className="text-sm text-pos-text-muted mb-4">Selecione a forma de pagamento:</p>
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => handleSelectMethod(pm.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-pos-bg hover:bg-pos-surface-hover transition-all active:scale-[0.98]"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pm.color}`}>
                    <pm.icon className="w-6 h-6" />
                  </div>
                  <span className="text-base font-medium text-pos-text">{pm.label}</span>
                </button>
              ))}

              {/* Split payment toggle */}
              {!isSplit && completedPayments.length === 0 && (
                <button
                  onClick={enableSplit}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-pos-border text-pos-text-muted hover:text-pos-accent hover:border-pos-accent transition-all text-sm"
                >
                  <Split className="w-4 h-4" />
                  Pagamento Misto (dividir formas)
                </button>
              )}
            </motion.div>
          )}

          {/* Step: Enter partial amount (split mode) */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const pm = paymentMethods.find((m) => m.id === method);
                  return pm ? (
                    <>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pm.color}`}>
                        <pm.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-pos-text">{pm.label}</span>
                    </>
                  ) : null;
                })()}
              </div>

              <div>
                <label className="text-sm font-medium text-pos-text mb-2 block">
                  Valor nesta forma ({formatCurrency(remaining)} restante)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={remaining}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder={formatCurrency(remaining)}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
                />
              </div>

              <button
                onClick={() => { setCurrentAmount(String(remaining)); }}
                className="w-full py-2 rounded-lg bg-pos-bg text-pos-text-muted text-sm hover:bg-pos-surface-hover transition-all"
              >
                Usar valor total restante ({formatCurrency(remaining)})
              </button>

              <button
                onClick={handleConfirmAmount}
                disabled={!currentAmount || Number(currentAmount) <= 0 || Number(currentAmount) > remaining}
                className="w-full py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* Step: Details (cash amount or installments) */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              {method === "dinheiro" && (
                <>
                  <div className="text-center mb-2">
                    <span className="text-sm text-pos-text-muted">Valor a pagar:</span>
                    <span className="pos-price text-lg ml-2">{formatCurrency(paymentAmount)}</span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-pos-text mb-2 block">
                      Valor Recebido
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={paymentAmount}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={formatCurrency(paymentAmount)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
                    />
                  </div>
                  {cashReceived && Number(cashReceived) >= paymentAmount && (
                    <div className="flex justify-between items-center p-4 rounded-xl bg-pos-bg">
                      <span className="text-sm text-pos-text-muted">Troco</span>
                      <span className="pos-price text-2xl">
                        {formatCurrency(Number(cashReceived) - paymentAmount)}
                      </span>
                    </div>
                  )}
                  {cashReceived && Number(cashReceived) < paymentAmount && (
                    <p className="text-xs text-destructive text-center">Valor insuficiente</p>
                  )}
                </>
              )}

              {method === "credito" && (
                <>
                  <div className="text-center mb-2">
                    <span className="text-sm text-pos-text-muted">Valor:</span>
                    <span className="pos-price text-lg ml-2">{formatCurrency(paymentAmount)}</span>
                  </div>
                  <label className="text-sm font-medium text-pos-text mb-2 block">
                    Parcelas
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setInstallments(n)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          installments === n
                            ? "bg-pos-accent text-primary-foreground"
                            : "bg-pos-bg text-pos-text hover:bg-pos-surface-hover"
                        }`}
                      >
                        {n}× {formatCurrency(paymentAmount / n)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleConfirmDetails}
                disabled={method === "dinheiro" && (!cashReceived || Number(cashReceived) < paymentAmount)}
                className="w-full py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {method === "dinheiro" ? "Confirmar Pagamento" : "Processar TEF"}
              </button>
            </motion.div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-pos-accent/10 flex items-center justify-center">
                  {method === "pix" ? (
                    <QrCode className="w-10 h-10 text-pos-accent sync-pulse" />
                  ) : (
                    <Smartphone className="w-10 h-10 text-pos-accent sync-pulse" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-pos-surface border-2 border-pos-border flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-pos-accent animate-spin" />
                </div>
              </div>

              <p className="text-base font-semibold text-pos-text mb-1">
                {method === "pix" ? "PIX" : "TEF"} em processamento
              </p>
              <p className="text-sm text-pos-text-muted mb-2">
                {formatCurrency(isSplit ? Number(currentAmount) || remaining : remaining)}
              </p>
              <p className="text-sm text-pos-accent font-medium mb-4">{processingStatus}</p>

              <div className="flex gap-2 mb-6">
                {(method === "pix" ? pixSteps : tefSteps).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i <= processingStep ? "bg-pos-accent" : "bg-pos-border"
                    }`}
                  />
                ))}
              </div>

              {method === "pix" && processingStep >= 1 && (
                <div className="w-40 h-40 bg-pos-bg rounded-xl border border-pos-border flex items-center justify-center mb-4">
                  <div className="grid grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 ${Math.random() > 0.4 ? "bg-pos-text" : "bg-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onCancel}
                className="text-sm text-pos-text-muted hover:text-destructive transition-colors"
              >
                Cancelar operação
              </button>
            </motion.div>
          )}

          {/* Step: Result of current payment */}
          {step === "result" && currentResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6"
            >
              <div className="flex flex-col items-center mb-6">
                {currentResult.approved ? (
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                )}
                <h4 className="text-lg font-bold text-pos-text">
                  {currentResult.approved ? "Pagamento Aprovado" : "Pagamento Negado"}
                </h4>
                <p className="text-sm text-pos-text-muted mt-1">
                  {formatCurrency(currentResult.amount)}
                </p>
              </div>

              {currentResult.approved && (
                <div className="space-y-2 p-4 rounded-xl bg-pos-bg text-sm mb-4">
                  {currentResult.nsu && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">NSU</span>
                      <span className="font-mono text-pos-text">{currentResult.nsu}</span>
                    </div>
                  )}
                  {currentResult.authCode && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Autorização</span>
                      <span className="font-mono text-pos-text">{currentResult.authCode}</span>
                    </div>
                  )}
                  {currentResult.cardBrand && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Bandeira</span>
                      <span className="text-pos-text">{currentResult.cardBrand} •••• {currentResult.cardLastDigits}</span>
                    </div>
                  )}
                  {currentResult.installments && currentResult.installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Parcelas</span>
                      <span className="text-pos-text">{currentResult.installments}×</span>
                    </div>
                  )}
                  {currentResult.changeAmount !== undefined && currentResult.changeAmount > 0 && (
                    <div className="flex justify-between pt-2 border-t border-pos-border">
                      <span className="text-pos-text-muted font-medium">Troco</span>
                      <span className="pos-price text-lg">{formatCurrency(currentResult.changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {!currentResult.approved && (
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 rounded-xl bg-pos-bg text-pos-text text-sm font-medium hover:bg-pos-surface-hover transition-all"
                  >
                    Tentar novamente
                  </button>
                )}
                <button
                  onClick={currentResult.approved ? handlePaymentApproved : onCancel}
                  className="flex-1 py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  {currentResult.approved
                    ? isSplit && remaining - currentResult.amount > 0.01
                      ? "Próximo Pagamento"
                      : "Finalizar Venda"
                    : "Cancelar"
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
