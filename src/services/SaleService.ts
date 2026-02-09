/**
 * SaleService — business logic for sales, decoupled from UI.
 * Can be consumed by hooks, edge functions, or offline queue.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Sale, SaleItem, PaymentResult } from "./types";

export class SaleService {
  /**
   * Finalize a sale: create fiscal document + register cash movement.
   * Returns the created sale record or throws.
   */
  static async finalizeSale(params: {
    companyId: string;
    userId: string;
    sessionId?: string;
    items: SaleItem[];
    total: number;
    paymentMethod: string;
    paymentResults?: PaymentResult[];
    customerCpf?: string;
    customerName?: string;
  }): Promise<{ fiscalDocId: string; nfceNumber: string }> {
    const { companyId, userId, sessionId, items, total, paymentMethod, paymentResults, customerCpf, customerName } = params;

    // 1. Create fiscal document
    const { data: doc, error: docErr } = await supabase
      .from("fiscal_documents")
      .insert({
        company_id: companyId,
        doc_type: "nfce",
        total_value: total,
        payment_method: paymentMethod,
        items_json: items as any,
        status: "pendente",
        issued_by: userId,
        customer_cpf_cnpj: customerCpf,
        customer_name: customerName,
      })
      .select("id, number")
      .single();

    if (docErr) throw new Error(`Erro ao criar documento fiscal: ${docErr.message}`);

    // 2. Register cash movements for each payment
    if (sessionId && paymentResults) {
      for (const pr of paymentResults) {
        await supabase.from("cash_movements").insert({
          company_id: companyId,
          session_id: sessionId,
          type: "venda",
          amount: pr.amount,
          payment_method: pr.method as any,
          performed_by: userId,
          sale_id: doc.id,
          description: `Venda #${doc.number || doc.id.slice(0, 8)} - ${pr.method}`,
        });
      }
    }

    // 3. Register TEF transactions for card/pix payments
    if (paymentResults) {
      for (const pr of paymentResults) {
        if (pr.method !== "dinheiro" && pr.approved) {
          await supabase.from("tef_transactions").insert({
            company_id: companyId,
            amount: pr.amount,
            payment_method: pr.method,
            status: "aprovado",
            nsu: pr.nsu,
            authorization_code: pr.auth_code,
            card_brand: pr.card_brand,
            card_last_digits: pr.card_last_digits,
            installments: pr.installments,
            pix_txid: pr.pix_tx_id,
            sale_id: doc.id,
            session_id: sessionId,
            processed_by: userId,
            transaction_date: new Date().toISOString(),
          });
        }
      }
    }

    // 4. Deduct stock for each item
    for (const item of items) {
      await StockService.registerMovement({
        companyId,
        userId,
        movement: {
          product_id: item.product_id,
          type: "venda",
          quantity: item.quantity,
          reference: doc.id,
        },
      });
    }

    return {
      fiscalDocId: doc.id,
      nfceNumber: String(doc.number || doc.id.slice(0, 6)).padStart(6, "0"),
    };
  }

  /**
   * List recent sales (fiscal documents) for a company.
   */
  static async listRecent(companyId: string, limit = 50) {
    const { data, error } = await supabase
      .from("fiscal_documents")
      .select("*")
      .eq("company_id", companyId)
      .eq("doc_type", "nfce")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

// Import here to avoid circular dependency at module level
import { StockService } from "./StockService";
