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
    clientUf?: string;
    clientType?: "pf" | "pj";
    a3Config?: {
      thumbprint: string;
      signerService: {
        signXml: (thumbprint: string, xml: string) => Promise<string>;
      };
    };
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
        if (pr.method !== "dinheiro" && pr.method !== "prazo" && pr.approved) {
          await supabase.from("tef_transactions").insert([{
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
          }]);
        }
      }
    }

    // 3.5 Handle credit sale (a prazo) — generate financial entries
    if (paymentResults) {
      for (const pr of paymentResults) {
        if (pr.method === "prazo" && pr.credit_client_id) {
          // Validate credit limit before proceeding
          const { data: clientData } = await supabase
            .from("clients")
            .select("credit_balance, credit_limit")
            .eq("id", pr.credit_client_id)
            .single();

          if (clientData) {
            const currentBalance = Number(clientData.credit_balance || 0);
            const limit = Number(clientData.credit_limit || 0);
            if (limit > 0 && currentBalance + pr.amount > limit) {
              throw new Error(
                `Limite de crédito excedido para este cliente. ` +
                `Saldo atual: R$ ${currentBalance.toFixed(2)}, ` +
                `Limite: R$ ${limit.toFixed(2)}, ` +
                `Valor da venda: R$ ${pr.amount.toFixed(2)}`
              );
            }
          }

          const installmentCount = pr.credit_installments || 1;
          const installmentAmount = Math.round((pr.amount / installmentCount) * 100) / 100;

          for (let i = 0; i < installmentCount; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + (i + 1));

            await supabase.from("financial_entries").insert({
              company_id: companyId,
              created_by: userId,
              type: "receber" as any,
              category: "vendas" as any,
              description: installmentCount > 1
                ? `Venda a prazo #${doc.id.slice(0, 8)} — ${pr.credit_client_name} (${i + 1}/${installmentCount})`
                : `Venda fiado #${doc.id.slice(0, 8)} — ${pr.credit_client_name}`,
              amount: i === installmentCount - 1
                ? pr.amount - installmentAmount * (installmentCount - 1)  // last installment gets remainder
                : installmentAmount,
              due_date: dueDate.toISOString().split("T")[0],
              status: "pendente" as any,
              counterpart: pr.credit_client_name,
              reference: doc.id,
            });
          }

          // Update client's credit_balance
          const { data: client } = await supabase
            .from("clients")
            .select("credit_balance")
            .eq("id", pr.credit_client_id)
            .single();

          if (client) {
            await supabase
              .from("clients")
              .update({ credit_balance: (Number(client.credit_balance) || 0) + pr.amount })
              .eq("id", pr.credit_client_id);
          }
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

    // 4.5 FiscalEngine validation
    try {
      const { FiscalEngine } = await import("./FiscalEngine");

      // Fetch company data for regime and UF
      const { data: company } = await supabase
        .from("companies")
        .select("tax_regime, address_state, modo_seguro_fiscal")
        .eq("id", companyId)
        .single();

      // Fetch fiscal categories for validation
      const { data: fiscalCats } = await supabase
        .from("fiscal_categories")
        .select("id, regime, operation_type, product_type, cfop, csosn, cst_icms, cest, mva")
        .eq("company_id", companyId);

      // Fetch full product data for fiscal fields
      const productIds = items.map(i => i.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, ncm, cest, cfop, csosn, cst_icms, fiscal_category_id")
        .in("id", productIds);

      const productMap = new Map((products || []).map(p => [p.id, p]));

      const validationItems = items.map(item => {
        const prod = productMap.get(item.product_id);
        return {
          product_id: item.product_id,
          name: item.name,
          sku: item.sku,
          ncm: item.ncm || prod?.ncm || undefined,
          cest: prod?.cest || undefined,
          cfop: prod?.cfop || undefined,
          csosn: prod?.csosn || undefined,
          cst_icms: prod?.cst_icms || undefined,
          fiscal_category_id: prod?.fiscal_category_id || undefined,
        };
      });

      const result = FiscalEngine.validate({
        companyId,
        userId,
        companyRegime: company?.tax_regime || "simples_nacional",
        companyUf: company?.address_state || "SP",
        clientUf: params.clientUf,
        clientType: params.clientType,
        clientCpfCnpj: customerCpf,
        clientName: customerName,
        modoSeguro: (company as any)?.modo_seguro_fiscal ?? true,
        items: validationItems,
        fiscalCategories: (fiscalCats || []) as any,
      });

      // Log validation result
      await FiscalEngine.logValidation({
        companyId,
        userId,
        documentId: doc.id,
        docType: "nfce",
        result,
        items: validationItems,
      });

      // If validation blocked, reject the document but don't block the sale
      if (!result.approved) {
        const errorMessages = result.errors.map(e => e.message).join("; ");
        console.warn("[FiscalEngine] Validação bloqueou emissão:", errorMessages);

        await supabase
          .from("fiscal_documents")
          .update({ rejection_reason: `Validação fiscal: ${errorMessages}`, status: "rejeitado" as any })
          .eq("id", doc.id);

        return {
          fiscalDocId: doc.id,
          nfceNumber: String(doc.number || doc.id.slice(0, 6)).padStart(6, "0"),
        };
      }

      if (result.warnings.length > 0) {
        console.info("[FiscalEngine] Avisos:", result.warnings.map(w => w.message));
      }
    } catch (err: any) {
      console.warn("[FiscalEngine] Erro na validação, continuando emissão:", err.message);
    }

    // 5. Trigger NFC-e emission
    // If A3 config is provided, use the interactive A3 signing flow
    // Otherwise, use the standard fire-and-forget A1 flow
    if (params.a3Config) {
      try {
        const { FiscalEmissionService } = await import("./FiscalEmissionService");
        await FiscalEmissionService.emitirComA3({
          fiscalDocumentId: doc.id,
          docType: "nfce",
          thumbprint: params.a3Config.thumbprint,
          items,
          total,
          paymentMethod,
          customerCpf,
          customerName,
          signerService: params.a3Config.signerService,
        });
      } catch (err: any) {
        console.warn("[NFC-e A3] Emissão com certificado A3 falhou:", err.message);
        // Don't block the sale — document stays as "pendente"
      }
    } else {
      try {
        const { FiscalEmissionService } = await import("./FiscalEmissionService");
        FiscalEmissionService.emitirNfce({
          fiscalDocumentId: doc.id,
          items,
          total,
          paymentMethod,
          paymentAmounts: paymentResults ? paymentResults.map(pr => pr.amount) : undefined,
          customerCpf,
          customerName,
        }).catch((err) => {
          console.warn("[NFC-e] Emissão automática falhou, será retentada:", err.message);
        });
      } catch {
        // FiscalEmissionService not available (e.g. offline) — skip
      }
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
