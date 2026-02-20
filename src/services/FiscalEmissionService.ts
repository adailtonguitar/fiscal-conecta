/**
 * FiscalEmissionService — communicates with the nuvem-fiscal edge function
 * to emit, cancel, and query NFC-e/NF-e via Nuvem Fiscal API.
 */
import { supabase } from "@/integrations/supabase/client";

const FUNCTION_NAME = "nuvem-fiscal";

async function callFunction(action: string, method: "GET" | "POST", body?: unknown, extraParams?: Record<string, string>) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;

  const params = new URLSearchParams({ action, ...extraParams });
  const url = `${projectUrl}/functions/v1/${FUNCTION_NAME}?${params.toString()}`;

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: method === "POST" && body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `Erro ${resp.status}`);
  }

  return resp.json();
}

export class FiscalEmissionService {
  /**
   * Emit an NFC-e through Nuvem Fiscal (A1 certificate — fully server-side).
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
    paymentAmounts?: number[];
    customerCpf?: string;
    customerName?: string;
  }) {
    return callFunction("emitir-nfce", "POST", {
      fiscal_document_id: params.fiscalDocumentId,
      items: params.items,
      total: params.total,
      payment_method: params.paymentMethod,
      payment_amounts: params.paymentAmounts,
      customer_cpf: params.customerCpf,
      customer_name: params.customerName,
    });
  }

  /**
   * A3 Flow Step 1: Generate unsigned XML on the server.
   * Returns the XML that needs to be signed locally by the A3 certificate.
   */
  static async gerarXmlParaAssinatura(params: {
    fiscalDocumentId: string;
    docType: "nfce" | "nfe";
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
    return callFunction("gerar-xml", "POST", {
      fiscal_document_id: params.fiscalDocumentId,
      doc_type: params.docType,
      items: params.items,
      total: params.total,
      payment_method: params.paymentMethod,
      customer_cpf: params.customerCpf,
      customer_name: params.customerName,
    });
  }

  /**
   * A3 Flow Step 2: Submit the locally-signed XML back to the server
   * for transmission to SEFAZ via Nuvem Fiscal.
   */
  static async enviarXmlAssinado(params: {
    nuvemFiscalId: string;
    fiscalDocumentId: string;
    docType: "nfce" | "nfe";
    signedXml: string;
  }) {
    return callFunction("enviar-xml-assinado", "POST", {
      nuvem_fiscal_id: params.nuvemFiscalId,
      fiscal_document_id: params.fiscalDocumentId,
      doc_type: params.docType,
      signed_xml: params.signedXml,
    });
  }

  /**
   * Full A3 emission flow: generate XML → sign locally → submit signed XML.
   * Requires localSignerService to be connected with a selected certificate.
   */
  static async emitirComA3(params: {
    fiscalDocumentId: string;
    docType: "nfce" | "nfe";
    thumbprint: string;
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
    signerService: {
      signXml: (thumbprint: string, xml: string) => Promise<string>;
    };
  }) {
    // Step 1: Generate unsigned XML
    const xmlResult = await this.gerarXmlParaAssinatura({
      fiscalDocumentId: params.fiscalDocumentId,
      docType: params.docType,
      items: params.items,
      total: params.total,
      paymentMethod: params.paymentMethod,
      customerCpf: params.customerCpf,
      customerName: params.customerName,
    });

    if (!xmlResult?.xml) {
      throw new Error("Servidor não retornou XML para assinatura. Verifique a configuração fiscal.");
    }

    // Step 2: Sign locally with A3 certificate
    const signedXml = await params.signerService.signXml(params.thumbprint, xmlResult.xml);

    if (!signedXml) {
      throw new Error("Falha na assinatura local. Verifique se o token A3 está conectado.");
    }

    // Step 3: Submit signed XML
    const emissionResult = await this.enviarXmlAssinado({
      nuvemFiscalId: xmlResult.nuvem_fiscal_id,
      fiscalDocumentId: params.fiscalDocumentId,
      docType: params.docType,
      signedXml,
    });

    return emissionResult;
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
