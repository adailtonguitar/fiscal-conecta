import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  ArrowLeft,
  Receipt,
  Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

type PaymentStep = "select" | "details" | "processing" | "result";
type PaymentMethodType = "dinheiro" | "debito" | "credito" | "pix";

interface TEFProcessorProps {
  total: number;
  onComplete: (result: TEFResult) => void;
  onCancel: () => void;
}

export interface TEFResult {
  method: PaymentMethodType;
  approved: boolean;
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

export function TEFProcessor({ total, onComplete, onCancel }: TEFProcessorProps) {
  const [step, setStep] = useState<PaymentStep>("select");
  const [method, setMethod] = useState<PaymentMethodType | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [installments, setInstallments] = useState(1);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState<TEFResult | null>(null);

  const changeAmount = method === "dinheiro" && cashReceived ? Number(cashReceived) - total : 0;

  const generateNSU = () => String(Math.floor(Math.random() * 999999999)).padStart(9, "0");
  const generateAuthCode = () => String(Math.floor(Math.random() * 999999)).padStart(6, "0");
  const generatePixTxId = () => `E${String(Math.floor(Math.random() * 99999999999)).padStart(32, "0")}`;

  const processPayment = useCallback(async () => {
    if (!method) return;
    setStep("processing");

    const steps = method === "pix" ? pixSteps : method === "dinheiro" ? [] : tefSteps;

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i);
      setProcessingStatus(steps[i].status);
      await new Promise((r) => setTimeout(r, steps[i].duration));
    }

    // Simulate 95% approval rate
    const approved = Math.random() > 0.05;
    const brand = cardBrands[Math.floor(Math.random() * cardBrands.length)];

    const tefResult: TEFResult = {
      method,
      approved,
      nsu: approved ? generateNSU() : undefined,
      authCode: approved ? generateAuthCode() : undefined,
      cardBrand: method === "debito" || method === "credito" ? brand : undefined,
      cardLastDigits: method === "debito" || method === "credito" ? String(Math.floor(Math.random() * 9999)).padStart(4, "0") : undefined,
      installments: method === "credito" ? installments : undefined,
      changeAmount: method === "dinheiro" ? changeAmount : undefined,
      pixTxId: method === "pix" ? generatePixTxId() : undefined,
    };

    setResult(tefResult);
    setStep("result");
  }, [method, installments, changeAmount, total]);

  const handleSelectMethod = (m: PaymentMethodType) => {
    setMethod(m);
    if (m === "dinheiro") {
      setStep("details");
    } else if (m === "credito") {
      setStep("details");
    } else {
      processPayment();
      setMethod(m);
    }
  };

  // Trigger processing when method is set and we skip details
  useEffect(() => {
    if (method && (method === "debito" || method === "pix") && step === "select") {
      processPayment();
    }
  }, [method]); // eslint-disable-line

  const handleConfirmDetails = () => {
    if (method === "dinheiro") {
      const received = Number(cashReceived);
      if (received < total) return;
      const tefResult: TEFResult = {
        method: "dinheiro",
        approved: true,
        changeAmount: received - total,
      };
      setResult(tefResult);
      setStep("result");
    } else {
      processPayment();
    }
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
        <div className="px-6 py-4 border-b border-pos-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-pos-text">Pagamento</h3>
            <p className="pos-price text-xl mt-0.5">{formatCurrency(total)}</p>
          </div>
          {step !== "processing" && (
            <button
              onClick={step === "select" ? onCancel : () => setStep("select")}
              className="p-2 rounded-lg text-pos-text-muted hover:text-pos-text hover:bg-pos-bg transition-colors"
            >
              {step === "select" ? <XCircle className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select payment method */}
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
            </motion.div>
          )}

          {/* Step 2: Details (cash amount or installments) */}
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
                  <div>
                    <label className="text-sm font-medium text-pos-text mb-2 block">
                      Valor Recebido
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={total}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder={formatCurrency(total)}
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-pos-bg border border-pos-border text-pos-text text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
                    />
                  </div>
                  {cashReceived && Number(cashReceived) >= total && (
                    <div className="flex justify-between items-center p-4 rounded-xl bg-pos-bg">
                      <span className="text-sm text-pos-text-muted">Troco</span>
                      <span className="pos-price text-2xl">
                        {formatCurrency(Number(cashReceived) - total)}
                      </span>
                    </div>
                  )}
                  {cashReceived && Number(cashReceived) < total && (
                    <p className="text-xs text-destructive text-center">Valor insuficiente</p>
                  )}
                </>
              )}

              {method === "credito" && (
                <>
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
                        {n}× {formatCurrency(total / n)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={handleConfirmDetails}
                disabled={method === "dinheiro" && (!cashReceived || Number(cashReceived) < total)}
                className="w-full py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {method === "dinheiro" ? "Confirmar Pagamento" : "Processar TEF"}
              </button>
            </motion.div>
          )}

          {/* Step 3: Processing */}
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

              <p className="text-base font-semibold text-pos-text mb-2">
                {method === "pix" ? "PIX" : "TEF"} em processamento
              </p>
              <p className="text-sm text-pos-accent font-medium mb-4">{processingStatus}</p>

              {/* Progress dots */}
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

          {/* Step 4: Result */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6"
            >
              <div className="flex flex-col items-center mb-6">
                {result.approved ? (
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-3">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                )}
                <h4 className="text-lg font-bold text-pos-text">
                  {result.approved ? "Pagamento Aprovado" : "Pagamento Negado"}
                </h4>
              </div>

              {result.approved && (
                <div className="space-y-2 p-4 rounded-xl bg-pos-bg text-sm mb-4">
                  {result.nsu && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">NSU</span>
                      <span className="font-mono text-pos-text">{result.nsu}</span>
                    </div>
                  )}
                  {result.authCode && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Autorização</span>
                      <span className="font-mono text-pos-text">{result.authCode}</span>
                    </div>
                  )}
                  {result.cardBrand && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Bandeira</span>
                      <span className="text-pos-text">{result.cardBrand}</span>
                    </div>
                  )}
                  {result.cardLastDigits && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Cartão</span>
                      <span className="font-mono text-pos-text">•••• {result.cardLastDigits}</span>
                    </div>
                  )}
                  {result.installments && result.installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">Parcelas</span>
                      <span className="text-pos-text">{result.installments}× {formatCurrency(total / result.installments)}</span>
                    </div>
                  )}
                  {result.pixTxId && (
                    <div className="flex justify-between">
                      <span className="text-pos-text-muted">TxID</span>
                      <span className="font-mono text-pos-text text-xs truncate max-w-[180px]">{result.pixTxId}</span>
                    </div>
                  )}
                  {result.changeAmount !== undefined && result.changeAmount > 0 && (
                    <div className="flex justify-between pt-2 border-t border-pos-border">
                      <span className="text-pos-text-muted font-medium">Troco</span>
                      <span className="pos-price text-lg">{formatCurrency(result.changeAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {!result.approved && (
                  <button
                    onClick={() => { setStep("select"); setResult(null); }}
                    className="flex-1 py-3 rounded-xl bg-pos-bg text-pos-text text-sm font-medium hover:bg-pos-surface-hover transition-all"
                  >
                    Tentar novamente
                  </button>
                )}
                <button
                  onClick={() => onComplete(result)}
                  className="flex-1 py-3 rounded-xl bg-pos-accent text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  {result.approved ? "Finalizar Venda" : "Cancelar"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
