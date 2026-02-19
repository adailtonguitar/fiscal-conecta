/**
 * FiscalEngine — Motor de Segurança Fiscal.
 * Valida regras fiscais obrigatórias antes da emissão de NF-e/NFC-e.
 * Todas as validações são logadas na tabela fiscal_audit_logs.
 */
import { supabase } from "@/integrations/supabase/client";
import { isValidNcmFormat, isNcmInOfficialTable, isNcmExpired } from "@/lib/ncm-validator";
import { validateCstCsosn, type TaxRegime } from "@/lib/cst-csosn-validator";
import { isTypicalStNcm } from "@/lib/icms-st-engine";

export interface FiscalValidationItem {
  product_id: string;
  name: string;
  sku: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  csosn?: string;
  cst_icms?: string;
  fiscal_category_id?: string | null;
  product_type?: "normal" | "st";
  mva?: number | null;
}

export interface FiscalValidationContext {
  companyId: string;
  userId: string;
  companyRegime: string; // simples_nacional, lucro_presumido, lucro_real
  companyUf: string;
  clientUf?: string;
  clientType?: "pf" | "pj"; // pessoa física ou jurídica
  modoSeguro: boolean;
  items: FiscalValidationItem[];
  fiscalCategories: Array<{
    id: string;
    regime: string;
    operation_type: string;
    product_type: string;
    cfop: string;
    csosn: string | null;
    cst_icms: string | null;
    cest: string | null;
    mva: number | null;
  }>;
}

export interface FiscalValidationResult {
  approved: boolean;
  errors: FiscalError[];
  warnings: FiscalError[];
}

export interface FiscalError {
  rule: string;
  product?: string;
  message: string;
  severity: "error" | "warning";
}

export class FiscalEngine {
  /**
   * Run all fiscal validation rules against the given context.
   * Returns a result with errors (blocking) and warnings (non-blocking).
   */
  static validate(ctx: FiscalValidationContext): FiscalValidationResult {
    const errors: FiscalError[] = [];
    const warnings: FiscalError[] = [];

    for (const item of ctx.items) {
      // REGRA 1 — Regime tributário
      this.validateRegime(ctx, item, errors);

      // REGRA 2 — NCM obrigatório + validação
      this.validateNcm(item, errors, warnings);

      // REGRA 3 — Produto ST exige CEST
      this.validateSt(ctx, item, errors);

      // REGRA 4 — CFOP compatível com UF
      this.validateCfop(ctx, item, errors, warnings);

      // REGRA 5 — Regime da categoria fiscal deve bater com empresa
      this.validateCategoryRegime(ctx, item, errors);

      // REGRA 6 — MVA obrigatório para ST próprio
      this.validateMva(ctx, item, errors, warnings);

      // REGRA 7 — Categoria fiscal vinculada
      if (!item.fiscal_category_id) {
        errors.push({
          rule: "CATEGORIA_FISCAL",
          product: item.name,
          message: `Produto "${item.name}" sem categoria fiscal vinculada`,
          severity: "error",
        });
      }

      // REGRA 8 — NCM típico de ST sem ST configurada
      this.validateStNcmMismatch(ctx, item, warnings);
    }

    // REGRA 7 — DIFAL para consumidor final interestadual
    if (ctx.clientUf && ctx.companyUf && ctx.clientUf !== ctx.companyUf && ctx.clientType === "pf") {
      warnings.push({
        rule: "DIFAL",
        message: "Operação interestadual com consumidor final (PF) — DIFAL deve ser calculado",
        severity: "warning",
      });
    }

    const approved = ctx.modoSeguro ? errors.length === 0 : true;

    return { approved, errors, warnings };
  }

  /**
   * REGRA 1: Simples Nacional → CSOSN obrigatório, CST_ICMS proibido
   *          Lucro Presumido/Real → CST_ICMS obrigatório
   */
  private static validateRegime(ctx: FiscalValidationContext, item: FiscalValidationItem, errors: FiscalError[]) {
    const result = validateCstCsosn({
      regime: ctx.companyRegime as TaxRegime,
      csosn: item.csosn,
      cstIcms: item.cst_icms,
      productType: item.product_type,
    });

    for (const err of result.errors) {
      errors.push({
        rule: err.type === "wrong_regime" ? "REGIME_CST_BLOQUEADO" : err.type === "missing" ? "REGIME_CSOSN" : "REGIME_CST",
        product: item.name,
        message: `Produto "${item.name}": ${err.message}`,
        severity: "error",
      });
    }

    for (const warn of result.warnings) {
      errors.push({
        rule: "REGIME_CST_AVISO",
        product: item.name,
        message: `Produto "${item.name}": ${warn.message}`,
        severity: "warning",
      });
    }
  }

  /**
   * REGRA 2: NCM obrigatório + formato válido + tabela oficial + não expirado
   */
  private static validateNcm(item: FiscalValidationItem, errors: FiscalError[], warnings: FiscalError[]) {
    if (!item.ncm || item.ncm.trim().length === 0) {
      errors.push({
        rule: "NCM_VAZIO",
        product: item.name,
        message: `Produto "${item.name}" sem NCM configurado`,
        severity: "error",
      });
      return;
    }

    const ncm = item.ncm.trim();

    // Format validation
    if (!isValidNcmFormat(ncm)) {
      errors.push({
        rule: "NCM_FORMATO_INVALIDO",
        product: item.name,
        message: `Produto "${item.name}": NCM "${ncm}" deve ter exatamente 8 dígitos numéricos`,
        severity: "error",
      });
      return;
    }

    // Expired NCM check
    const expiredMsg = isNcmExpired(ncm);
    if (expiredMsg) {
      errors.push({
        rule: "NCM_EXPIRADO",
        product: item.name,
        message: `Produto "${item.name}": NCM "${ncm}" foi revogado — ${expiredMsg}`,
        severity: "error",
      });
    }

    // Official table check (warning only — table may not be exhaustive)
    if (!isNcmInOfficialTable(ncm)) {
      warnings.push({
        rule: "NCM_NAO_ENCONTRADO",
        product: item.name,
        message: `Produto "${item.name}": NCM "${ncm}" não encontrado na tabela de referência`,
        severity: "warning",
      });
    }
  }

  /**
   * REGRA 3: Produto ST exige CEST
   */
  private static validateSt(ctx: FiscalValidationContext, item: FiscalValidationItem, errors: FiscalError[]) {
    const category = item.fiscal_category_id
      ? ctx.fiscalCategories.find(c => c.id === item.fiscal_category_id)
      : null;

    const productType = category?.product_type || item.product_type;

    if (productType === "st") {
      const cest = item.cest || category?.cest;
      if (!cest || cest.trim().length === 0) {
        errors.push({
          rule: "ST_SEM_CEST",
          product: item.name,
          message: `Produto ST "${item.name}" exige CEST`,
          severity: "error",
        });
      }
    }
  }

  /**
   * REGRA 4: CFOP deve ser compatível com operação (interna vs interestadual)
   */
  private static validateCfop(
    ctx: FiscalValidationContext,
    item: FiscalValidationItem,
    errors: FiscalError[],
    warnings: FiscalError[]
  ) {
    if (!ctx.clientUf || !ctx.companyUf) return; // Sem UF do cliente, não valida

    const isInterstate = ctx.clientUf !== ctx.companyUf;
    const cfop = item.cfop || "";

    if (isInterstate) {
      // Interestadual: CFOP deve começar com 6
      if (cfop.startsWith("5")) {
        errors.push({
          rule: "CFOP_INCOMPATIVEL",
          product: item.name,
          message: `Produto "${item.name}": Operação interestadual exige CFOP série 6xxx (atual: ${cfop})`,
          severity: "error",
        });
      }
    } else {
      // Interna: CFOP deve começar com 5
      if (cfop.startsWith("6")) {
        errors.push({
          rule: "CFOP_INCOMPATIVEL",
          product: item.name,
          message: `Produto "${item.name}": Operação interna exige CFOP série 5xxx (atual: ${cfop})`,
          severity: "error",
        });
      }
    }
  }

  /**
   * REGRA 5: Regime da categoria fiscal deve ser compatível com empresa
   */
  private static validateCategoryRegime(ctx: FiscalValidationContext, item: FiscalValidationItem, errors: FiscalError[]) {
    if (!item.fiscal_category_id) return;

    const category = ctx.fiscalCategories.find(c => c.id === item.fiscal_category_id);
    if (!category) return;

    if (category.regime !== ctx.companyRegime) {
      errors.push({
        rule: "REGIME_DIVERGENTE",
        product: item.name,
        message: `Produto "${item.name}": Categoria fiscal (${category.regime}) diverge do regime da empresa (${ctx.companyRegime})`,
        severity: "error",
      });
    }
  }

  /**
   * REGRA 6: MVA obrigatório para ST próprio
   */
  private static validateMva(
    ctx: FiscalValidationContext,
    item: FiscalValidationItem,
    errors: FiscalError[],
    warnings: FiscalError[]
  ) {
    const category = item.fiscal_category_id
      ? ctx.fiscalCategories.find(c => c.id === item.fiscal_category_id)
      : null;

    const productType = category?.product_type || item.product_type;
    const mva = item.mva ?? category?.mva;

    if (productType === "st" && (mva === null || mva === undefined)) {
      if (ctx.modoSeguro) {
        errors.push({
          rule: "MVA_AUSENTE",
          product: item.name,
          message: `Produto ST "${item.name}" exige MVA configurado`,
          severity: "error",
        });
      } else {
        warnings.push({
          rule: "MVA_AUSENTE",
          product: item.name,
          message: `Produto ST "${item.name}" sem MVA — verifique antes de emitir`,
          severity: "warning",
        });
      }
    }
  }

  /**
   * REGRA 8: NCM típico de ST mas produto não configurado como ST
   */
  private static validateStNcmMismatch(
    ctx: FiscalValidationContext,
    item: FiscalValidationItem,
    warnings: FiscalError[]
  ) {
    const stCheck = isTypicalStNcm(item.ncm);
    if (!stCheck.isTypical) return;

    const category = item.fiscal_category_id
      ? ctx.fiscalCategories.find(c => c.id === item.fiscal_category_id)
      : null;

    const productType = category?.product_type || item.product_type;
    if (productType !== "st") {
      warnings.push({
        rule: "NCM_ST_SEM_CONFIG",
        product: item.name,
        message: `Produto "${item.name}" com NCM típico de ST (${stCheck.description}) mas não configurado como ST`,
        severity: "warning",
      });
    }
  }

  /**
   * Log all validation results to fiscal_audit_logs.
   */
  static async logValidation(params: {
    companyId: string;
    userId: string;
    documentId?: string;
    docType?: "nfce" | "nfe";
    result: FiscalValidationResult;
    items: FiscalValidationItem[];
  }): Promise<void> {
    const allIssues = [...params.result.errors, ...params.result.warnings];

    // Log individual rule validations
    const logs = allIssues.map(issue => ({
      company_id: params.companyId,
      user_id: params.userId,
      document_id: params.documentId || null,
      doc_type: params.docType || null,
      action: `fiscal_validation_${issue.severity === "error" ? "BLOQUEADO" : "AVISO"}`,
      details: {
        regra: issue.rule,
        produto: issue.product || null,
        mensagem: issue.message,
        status: issue.severity === "error" ? "BLOQUEADO" : "APROVADO_COM_AVISO",
      },
    }));

    // Always log the overall result
    logs.push({
      company_id: params.companyId,
      user_id: params.userId,
      document_id: params.documentId || null,
      doc_type: params.docType || null,
      action: params.result.approved ? "fiscal_validation_APROVADO" : "fiscal_validation_BLOQUEADO",
      details: {
        regra: "RESULTADO_GERAL",
        produto: null,
        mensagem: params.result.approved
          ? `Validação aprovada (${params.result.warnings.length} avisos)`
          : `Validação bloqueada: ${params.result.errors.length} erros`,
        status: params.result.approved ? "APROVADO" : "BLOQUEADO",
      },
    });

    if (logs.length > 0) {
      await supabase.from("fiscal_audit_logs").insert(logs as any);
    }
  }
}
