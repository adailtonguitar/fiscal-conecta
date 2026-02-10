/**
 * FiscalEmissionService — communicates with the nuvem-fiscal edge function
 * to emit, cancel, and query NFC-e/NF-e via Nuvem Fiscal API.
 */
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "nuvem-fiscal";

async function callFunction(action: string, method: "GET" | "POST", body?: unknown, extraParams?: Record<string, string>) {
  const params = new URLSearchParams({ action, ...extraParams });

  if (method === "GET") {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
      // @ts-ignore - pass query params via URL workaround
    });

    // For GET requests we need to use fetch directly
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const projectUrl = import.meta.env.VITE_SUPABASE_URL;

    const resp = await fetch(`${projectUrl}/functions/v1/${FUNCTION_NAME}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      throw new Error(err.error || `Erro ${resp.status}`);
    }

    return resp.json();
  }

  // POST
  const { data, error } = await supabase.functions.invoke(`${FUNCTION_NAME}?${params.toString()}`, {
    body,
  });

  if (error) throw new Error(error.message || "Erro ao chamar função fiscal");
  return data;
}

export class FiscalEmissionService {
  /**
   * Emit an NFC-e through Nuvem Fiscal.
   * The fiscal_document must already exist in our DB (status=pendente).
   */
  static async emitirNfce(params: {
    fiscalDocumentId: string;
    items: Array<{
      product_id: string;
      name: string;
      sku: string;
      quantity: number;
      unit_price: number;
      unit: string;
      ncm?: string;
    }>;
    total: number;
    paymentMethod: string;
    customerCpf?: string;
    customerName?: string;
  }) {
    return callFunction("emitir-nfce", "POST", {
      fiscal_document_id: params.fiscalDocumentId,
      items: params.items,
      total: params.total,
      payment_method: params.paymentMethod,
      customer_cpf: params.customerCpf,
      customer_name: params.customerName,
    });
  }

  /**
   * Cancel an authorized NFC-e.
   */
  static async cancelarNfce(params: {
    nuvemFiscalId: string;
    fiscalDocumentId: string;
    justificativa: string;
  }) {
    return callFunction("cancelar-nfce", "POST", {
      nuvem_fiscal_id: params.nuvemFiscalId,
      fiscal_document_id: params.fiscalDocumentId,
      justificativa: params.justificativa,
    });
  }

  /**
   * Query a document's current status.
   */
  static async consultar(nuvemFiscalId: string, docType: "nfce" | "nfe" = "nfce") {
    return callFunction("consultar", "GET", undefined, { nuvem_fiscal_id: nuvemFiscalId, doc_type: docType });
  }

  /**
   * Download PDF of a document (returns base64).
   */
  static async downloadPdf(nuvemFiscalId: string, docType: "nfce" | "nfe" = "nfce") {
    return callFunction("pdf", "GET", undefined, { nuvem_fiscal_id: nuvemFiscalId, doc_type: docType });
  }

  /**
   * Check SEFAZ service status.
   */
  static async statusSefaz(docType: "nfce" | "nfe" = "nfce") {
    return callFunction("status-sefaz", "GET", undefined, { doc_type: docType });
  }
}
