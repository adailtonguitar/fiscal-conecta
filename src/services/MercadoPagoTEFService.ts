/**
 * Service for Mercado Pago Point TEF integration.
 * Calls the tef-mercadopago edge function to create and poll payment intents.
 */
import { supabase } from "@/integrations/supabase/client";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // 3 minutes max

export interface MPPaymentResult {
  approved: boolean;
  paymentIntentId?: string;
  paymentId?: string;
  status?: string;
  cardBrand?: string;
  cardLastDigits?: string;
  installments?: number;
  nsu?: string;
  authCode?: string;
  errorMessage?: string;
}

async function callTefFunction(body: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Usuário não autenticado");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tef-mercadopago`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || `Erro ${resp.status}`);
  }
  return data;
}

export class MercadoPagoTEFService {
  /**
   * Create a payment intent and poll for result.
   * Returns when payment is approved, rejected, or times out.
   */
  static async processPayment(params: {
    accessToken: string;
    deviceId: string;
    companyId: string;
    amount: number;
    description?: string;
    installments?: number;
    onStatusChange?: (status: string) => void;
  }): Promise<MPPaymentResult> {
    const { accessToken, deviceId, companyId, amount, description, installments, onStatusChange } = params;

    // 1. Create payment intent
    onStatusChange?.("Enviando para maquininha...");

    const createResp = await callTefFunction({
      action: "create_payment_intent",
      accessToken,
      deviceId,
      companyId,
      amount,
      description,
      installments,
    });

    const paymentIntentId = createResp.data?.id;
    if (!paymentIntentId) {
      return { approved: false, errorMessage: "Não foi possível criar o intent de pagamento" };
    }

    // 2. Poll for result
    onStatusChange?.("Aguardando pagamento na maquininha...");

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      try {
        const checkResp = await callTefFunction({
          action: "check_payment_intent",
          accessToken,
          paymentIntentId,
        });

        const intentData = checkResp.data;
        const state = intentData?.state;

        if (state === "FINISHED") {
          const payment = intentData.payment;
          const isApproved = payment?.status === "approved";

          onStatusChange?.(isApproved ? "Pagamento aprovado!" : "Pagamento não aprovado");

          return {
            approved: isApproved,
            paymentIntentId,
            paymentId: payment?.id?.toString(),
            status: payment?.status,
            cardBrand: payment?.card_data?.brand,
            cardLastDigits: payment?.card_data?.last_four_digits,
            installments: payment?.installments,
            nsu: payment?.id?.toString(),
            authCode: payment?.authorization_code,
            errorMessage: isApproved ? undefined : `Status: ${payment?.status || "desconhecido"}`,
          };
        }

        if (state === "CANCELED" || state === "ERROR" || state === "ABANDONED") {
          onStatusChange?.(`Pagamento ${state.toLowerCase()}`);
          return {
            approved: false,
            paymentIntentId,
            status: state,
            errorMessage: `Pagamento ${state.toLowerCase()}`,
          };
        }

        // Still processing
        if (state === "OPEN") {
          onStatusChange?.("Aguardando pagamento na maquininha...");
        } else if (state === "ON_TERMINAL") {
          onStatusChange?.("Processando na maquininha...");
        } else if (state === "PROCESSING") {
          onStatusChange?.("Comunicando com adquirente...");
        }
      } catch (err) {
        console.warn("[MP-TEF] Erro no polling, tentando novamente...", err);
      }
    }

    // Timeout
    onStatusChange?.("Tempo esgotado");
    return {
      approved: false,
      paymentIntentId,
      errorMessage: "Tempo esgotado aguardando pagamento",
    };
  }

  /**
   * Cancel a pending payment intent.
   */
  static async cancelPayment(params: {
    accessToken: string;
    deviceId: string;
    paymentIntentId: string;
  }) {
    try {
      await callTefFunction({
        action: "cancel_payment_intent",
        accessToken: params.accessToken,
        deviceId: params.deviceId,
        paymentIntentId: params.paymentIntentId,
      });
    } catch (err) {
      console.warn("[MP-TEF] Erro ao cancelar intent:", err);
    }
  }

  /**
   * Refund a completed payment (full or partial).
   */
  static async refundPayment(params: {
    accessToken: string;
    paymentId: string;
    amount?: number; // optional: partial refund amount
  }): Promise<{ success: boolean; refundId?: string; errorMessage?: string }> {
    try {
      const resp = await callTefFunction({
        action: "refund_payment",
        accessToken: params.accessToken,
        paymentId: params.paymentId,
        refundAmount: params.amount ? Math.round(params.amount * 100) : undefined,
      });
      return {
        success: true,
        refundId: resp.data?.id?.toString(),
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message || "Erro ao estornar pagamento",
      };
    }
  }

  /**
   * List available Point devices.
   */
  static async listDevices(accessToken: string) {
    const resp = await callTefFunction({
      action: "list_devices",
      accessToken,
    });
    return resp.data?.devices || [];
  }
}
