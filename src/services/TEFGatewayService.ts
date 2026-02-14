/**
 * TEFGatewayService — unified frontend service for all TEF acquirers.
 * Calls the tef-gateway edge function and normalizes responses.
 * Supports: Cielo, Rede, PagSeguro, Stone (via Pagar.me).
 */
import { supabase } from "@/integrations/supabase/client";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 72; // ~3 minutes

export interface TEFGatewayResult {
  approved: boolean;
  transactionId?: string;
  nsu?: string;
  authCode?: string;
  cardBrand?: string;
  cardLastDigits?: string;
  installments?: number;
  status?: string;
  errorMessage?: string;
  rawData?: unknown;
}

type TEFProvider = "cielo" | "rede" | "pagseguro" | "stone";

interface ProviderCredentials {
  provider: TEFProvider;
  environment: string;
  // Cielo
  merchantId?: string;
  merchantKey?: string;
  // Rede
  pv?: string;
  integrationKey?: string;
  // PagSeguro / Stone
  apiKey?: string;
  accessToken?: string;
}

async function callGateway(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("tef-gateway", { body });
  if (error) throw new Error(error.message || "Erro ao chamar gateway TEF");
  if (!data?.success) throw new Error(data?.data?.message || data?.error || "Transação não processada");
  return data;
}

function buildCredentials(creds: ProviderCredentials): Record<string, unknown> {
  const base: Record<string, unknown> = {
    provider: creds.provider,
    environment: creds.environment,
  };

  switch (creds.provider) {
    case "cielo":
      base.merchantId = creds.merchantId;
      base.merchantKey = creds.merchantKey || creds.apiKey;
      break;
    case "rede":
      base.pv = creds.pv || creds.merchantId;
      base.integrationKey = creds.integrationKey || creds.apiKey;
      break;
    case "pagseguro":
      base.accessToken = creds.accessToken || creds.apiKey;
      break;
    case "stone":
      base.apiKey = creds.apiKey;
      break;
  }

  return base;
}

// =================== Status normalization ===================

function normalizeCieloResult(data: any): TEFGatewayResult {
  const payment = data?.Payment || data?.payment || {};
  const status = payment.Status ?? payment.status;
  // Cielo statuses: 1=Authorized, 2=Captured, 3=Denied, 10=Voided, 12=Pending, 13=Aborted
  const approved = status === 1 || status === 2;

  return {
    approved,
    transactionId: payment.PaymentId || payment.paymentId,
    nsu: payment.ProofOfSale || payment.proofOfSale,
    authCode: payment.AuthorizationCode || payment.authorizationCode,
    cardBrand: payment.CreditCard?.Brand || payment.DebitCard?.Brand,
    cardLastDigits: payment.CreditCard?.CardNumber?.slice(-4) || payment.DebitCard?.CardNumber?.slice(-4),
    installments: payment.Installments || payment.installments,
    status: approved ? "approved" : "denied",
    errorMessage: approved ? undefined : (payment.ReturnMessage || `Status: ${status}`),
    rawData: data,
  };
}

function normalizeRedeResult(data: any): TEFGatewayResult {
  const returnCode = data?.returnCode || data?.returncode;
  const approved = returnCode === "00";

  return {
    approved,
    transactionId: data?.tid,
    nsu: data?.nsu,
    authCode: data?.authorizationCode || data?.authorization,
    cardBrand: data?.brand,
    installments: data?.installments,
    status: approved ? "approved" : "denied",
    errorMessage: approved ? undefined : (data?.returnMessage || `Código: ${returnCode}`),
    rawData: data,
  };
}

function normalizePagSeguroResult(data: any): TEFGatewayResult {
  const charges = data?.charges || [];
  const charge = charges[0] || {};
  const chargeStatus = charge?.status || data?.status;
  const approved = chargeStatus === "PAID" || chargeStatus === "AUTHORIZED";

  return {
    approved,
    transactionId: data?.id || charge?.id,
    nsu: charge?.payment_response?.reference,
    authCode: charge?.payment_response?.code,
    status: approved ? "approved" : (chargeStatus || "unknown"),
    errorMessage: approved ? undefined : (charge?.payment_response?.message || `Status: ${chargeStatus}`),
    rawData: data,
  };
}

function normalizeStoneResult(data: any): TEFGatewayResult {
  const charges = data?.charges || [];
  const charge = charges[0] || {};
  const lastTransaction = charge?.last_transaction || {};
  const chargeStatus = charge?.status || data?.status;
  const approved = chargeStatus === "paid" || chargeStatus === "captured";

  return {
    approved,
    transactionId: data?.id || charge?.id,
    nsu: lastTransaction?.acquirer_nsu || lastTransaction?.nsu,
    authCode: lastTransaction?.acquirer_auth_code || lastTransaction?.authorization_code,
    cardBrand: lastTransaction?.card?.brand,
    cardLastDigits: lastTransaction?.card?.last_four_digits,
    installments: lastTransaction?.installments,
    status: approved ? "approved" : (chargeStatus || "unknown"),
    errorMessage: approved ? undefined : (lastTransaction?.acquirer_message || `Status: ${chargeStatus}`),
    rawData: data,
  };
}

function normalizeResult(provider: TEFProvider, data: unknown): TEFGatewayResult {
  switch (provider) {
    case "cielo": return normalizeCieloResult(data);
    case "rede": return normalizeRedeResult(data);
    case "pagseguro": return normalizePagSeguroResult(data);
    case "stone": return normalizeStoneResult(data);
    default: return { approved: false, errorMessage: "Provedor desconhecido" };
  }
}

// =================== Public API ===================

export class TEFGatewayService {
  /**
   * Create a payment transaction and poll for result.
   */
  static async processPayment(params: {
    credentials: ProviderCredentials;
    amount: number;
    installments?: number;
    paymentType?: string; // "credito" | "debito"
    description?: string;
    onStatusChange?: (status: string) => void;
  }): Promise<TEFGatewayResult> {
    const { credentials, amount, installments, paymentType, onStatusChange } = params;
    const orderId = `PDV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    onStatusChange?.(`Conectando com ${credentials.provider.toUpperCase()}...`);

    try {
      // 1. Create transaction
      onStatusChange?.("Criando transação...");

      const createPayload = {
        ...buildCredentials(credentials),
        action: "create",
        amount,
        installments: installments || 1,
        paymentType: paymentType || "credito",
        orderId,
        description: params.description || "Venda PDV",
      };

      const createResp = await callGateway(createPayload);
      const createData = createResp.data;

      // Get the initial result
      const initialResult = normalizeResult(credentials.provider, createData);

      // If already approved or denied, return immediately
      if (initialResult.approved || initialResult.status === "denied") {
        onStatusChange?.(initialResult.approved ? "Pagamento aprovado!" : "Pagamento negado");
        return initialResult;
      }

      // 2. Poll for result if transaction is pending
      const transactionId = initialResult.transactionId || orderId;
      onStatusChange?.("Aguardando processamento...");

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        try {
          const checkPayload = {
            ...buildCredentials(credentials),
            action: "check",
            transactionId,
          };

          const checkResp = await callGateway(checkPayload);
          const checkResult = normalizeResult(credentials.provider, checkResp.data);

          if (checkResult.approved) {
            onStatusChange?.("Pagamento aprovado!");
            return checkResult;
          }

          if (checkResult.status === "denied" || checkResult.status === "cancelled" || checkResult.status === "failed") {
            onStatusChange?.("Pagamento negado");
            return checkResult;
          }

          // Still pending
          onStatusChange?.(`Processando... (${attempt + 1})`);
        } catch {
          // Ignore polling errors, retry
        }
      }

      // Timeout
      onStatusChange?.("Tempo esgotado");
      return {
        approved: false,
        transactionId,
        errorMessage: "Tempo esgotado aguardando processamento",
      };
    } catch (err: any) {
      onStatusChange?.("Erro na transação");
      return {
        approved: false,
        errorMessage: err.message || "Erro ao processar pagamento",
      };
    }
  }

  /**
   * Cancel/refund a transaction.
   */
  static async cancelTransaction(params: {
    credentials: ProviderCredentials;
    transactionId: string;
    chargeId?: string;
    amount: number;
  }): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      const payload = {
        ...buildCredentials(params.credentials),
        action: "cancel",
        transactionId: params.transactionId,
        chargeId: params.chargeId,
        amount: params.amount,
      };

      await callGateway(payload);
      return { success: true };
    } catch (err: any) {
      return { success: false, errorMessage: err.message };
    }
  }
}
