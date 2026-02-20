/**
 * SaleService — business logic for sales, decoupled from UI.
 * Can be consumed by hooks, edge functions, or offline queue.
 * 
 * PERFORMANCE: Operations are parallelized where possible and
 * non-critical work (fiscal validation, NFC-e emission) runs in background
 * so the receipt opens instantly after the fiscal document is created.
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

    // 1. Create fiscal document (CRITICAL — must complete before returning)
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

    // 2. Run cash movements, TEF, credit, and stock IN PARALLEL
    const parallelTasks: Promise<void>[] = [];

    // 2a. Cash movements (all at once via batch insert)
    if (sessionId && paymentResults && paymentResults.length > 0) {
      const movements = paymentResults.map((pr) => ({
        company_id: companyId,
        session_id: sessionId,
        type: "venda" as const,
        amount: pr.amount,
        payment_method: pr.method as any,
        performed_by: userId,
        sale_id: doc.id,
        description: `Venda #${doc.number || doc.id.slice(0, 8)} - ${pr.method}`,
      }));
      parallelTasks.push(
        supabase.from("cash_movements").insert(movements).then(({ error }) => {
          if (error) console.warn("[SaleService] Erro ao registrar movimentos:", error.message);
        }) as Promise<void>
      );
    }

    // 2b. TEF transactions (batch insert)
    if (paymentResults) {
      const tefRows = paymentResults
        .filter(pr => pr.method !== "dinheiro" && pr.method !== "prazo" && pr.approved)
        .map(pr => ({
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
        }));
      if (tefRows.length > 0) {
        parallelTasks.push(
          supabase.from("tef_transactions").insert(tefRows.map(r => ({
            ...r,
            payment_method: r.payment_method as any,
            status: r.status as any,
          }))).then(({ error }) => {
            if (error) console.warn("[SaleService] Erro ao registrar TEF:", error.message);
          }) as Promise<void>
        );
      }
    }

    // 2c. Credit sale handling
    if (paymentResults) {
      const creditPayments = paymentResults.filter(pr => pr.method === "prazo" && pr.credit_client_id);
      for (const pr of creditPayments) {
        parallelTasks.push(SaleService.handleCreditSale(companyId, userId, doc.id, pr));
      }
    }

    // 2d. Stock deduction (batch — all items in parallel)
    parallelTasks.push(SaleService.deductStockBatch(companyId, userId, doc.id, items));

    // Wait for all critical parallel operations
    await Promise.all(parallelTasks);

    // 3. BACKGROUND: Fiscal validation + NFC-e emission (non-blocking)
    SaleService.backgroundFiscalWork(params, doc.id, doc.number, items, total, paymentMethod, paymentResults, customerCpf, customerName)
      .catch(err => console.warn("[SaleService] Background fiscal work failed:", err.message));

    return {
      fiscalDocId: doc.id,
      nfceNumber: String(doc.number || doc.id.slice(0, 6)).padStart(6, "0"),
    };
  }

  /** Handle credit sale (prazo) — extracted for parallelization */
  private static async handleCreditSale(companyId: string, userId: string, docId: string, pr: PaymentResult): Promise<void> {
    // Validate credit limit
    const { data: clientData } = await supabase
      .from("clients")
      .select("credit_balance, credit_limit")
      .eq("id", pr.credit_client_id!)
      .single();

    if (clientData) {
      const currentBalance = Number(clientData.credit_balance || 0);
      const limit = Number(clientData.credit_limit || 0);
      if (limit > 0 && currentBalance + pr.amount > limit) {
        throw new Error(
          `Limite de crédito excedido. Saldo: R$ ${currentBalance.toFixed(2)}, Limite: R$ ${limit.toFixed(2)}, Valor: R$ ${pr.amount.toFixed(2)}`
        );
      }
    }

    const installmentCount = pr.credit_installments || 1;
    const installmentAmount = Math.round((pr.amount / installmentCount) * 100) / 100;

    // Batch insert financial entries
    const entries = [];
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i + 1));
      entries.push({
        company_id: companyId,
        created_by: userId,
        type: "receber" as any,
        category: "vendas" as any,
        description: installmentCount > 1
          ? `Venda a prazo #${docId.slice(0, 8)} — ${pr.credit_client_name} (${i + 1}/${installmentCount})`
          : `Venda fiado #${docId.slice(0, 8)} — ${pr.credit_client_name}`,
        amount: i === installmentCount - 1
          ? pr.amount - installmentAmount * (installmentCount - 1)
          : installmentAmount,
        due_date: dueDate.toISOString().split("T")[0],
        status: "pendente" as any,
        counterpart: pr.credit_client_name,
        reference: docId,
      });
    }
    await supabase.from("financial_entries").insert(entries);

    // Update client credit balance
    await supabase
      .from("clients")
      .update({ credit_balance: (Number(clientData?.credit_balance) || 0) + pr.amount })
      .eq("id", pr.credit_client_id!);
  }

  /** Deduct stock for all items in parallel */
  private static async deductStockBatch(companyId: string, userId: string, docId: string, items: SaleItem[]): Promise<void> {
    const { StockService } = await import("./StockService");
    await Promise.all(
      items.map(item =>
        StockService.registerMovement({
          companyId,
          userId,
          movement: {
            product_id: item.product_id,
            type: "venda",
            quantity: item.quantity,
            reference: docId,
          },
        }).catch(err => console.warn(`[Stock] Erro item ${item.product_id}:`, err.message))
      )
    );
  }

  /** Background fiscal validation + NFC-e emission (runs after receipt is shown) */
  private static async backgroundFiscalWork(
    params: any,
    docId: string,
    docNumber: number | null,
    items: SaleItem[],
    total: number,
    paymentMethod: string,
    paymentResults?: PaymentResult[],
    customerCpf?: string,
    customerName?: string,
  ): Promise<void> {
    const { companyId, userId } = params;

    // Fiscal validation
    try {
      const { FiscalEngine } = await import("./FiscalEngine");

      const [companyRes, fiscalCatsRes, productsRes] = await Promise.all([
        supabase.from("companies").select("tax_regime, address_state, modo_seguro_fiscal").eq("id", companyId).single(),
        supabase.from("fiscal_categories").select("id, regime, operation_type, product_type, cfop, csosn, cst_icms, cest, mva").eq("company_id", companyId),
        supabase.from("products").select("id, ncm, cest, cfop, csosn, cst_icms, fiscal_category_id").in("id", items.map(i => i.product_id)),
      ]);

      const company = companyRes.data;
      const fiscalCats = fiscalCatsRes.data;
      const products = productsRes.data;
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

      await FiscalEngine.logValidation({
        companyId, userId, documentId: docId, docType: "nfce", result, items: validationItems,
      });

      if (!result.approved) {
        const errorMessages = result.errors.map(e => e.message).join("; ");
        console.warn("[FiscalEngine] Validação bloqueou emissão:", errorMessages);
        await supabase
          .from("fiscal_documents")
          .update({ rejection_reason: `Validação fiscal: ${errorMessages}`, status: "rejeitado" as any })
          .eq("id", docId);
        return;
      }
    } catch (err: any) {
      console.warn("[FiscalEngine] Erro na validação, continuando emissão:", err.message);
    }

    // NFC-e emission
    if (params.a3Config) {
      try {
        const { FiscalEmissionService } = await import("./FiscalEmissionService");
        await FiscalEmissionService.emitirComA3({
          fiscalDocumentId: docId,
          docType: "nfce",
          thumbprint: params.a3Config.thumbprint,
          items, total, paymentMethod, customerCpf, customerName,
          signerService: params.a3Config.signerService,
        });
      } catch (err: any) {
        console.warn("[NFC-e A3] Emissão falhou:", err.message);
      }
    } else {
      try {
        const { FiscalEmissionService } = await import("./FiscalEmissionService");
        FiscalEmissionService.emitirNfce({
          fiscalDocumentId: docId,
          items, total, paymentMethod,
          paymentAmounts: paymentResults ? paymentResults.map(pr => pr.amount) : undefined,
          customerCpf, customerName,
        }).catch((err) => {
          console.warn("[NFC-e] Emissão automática falhou:", err.message);
        });
      } catch {
        // FiscalEmissionService not available
      }
    }
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
