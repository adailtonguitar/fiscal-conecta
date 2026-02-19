/**
 * CST / CSOSN Validator — Validação inteligente por regime tributário.
 *
 * Regras:
 * 1. Simples Nacional → usa CSOSN (CST ICMS proibido)
 * 2. Lucro Presumido / Lucro Real → usa CST ICMS (CSOSN proibido)
 * 3. Sugere códigos válidos conforme regime + tipo de produto
 * 4. Alerta quando código indevido é utilizado
 */

// ─── Tabela oficial de CSOSN (Simples Nacional) ────────────────────────────

export interface CstCsosnCode {
  code: string;
  description: string;
  /** Quando usar: normal, st, ambos */
  productType: "normal" | "st" | "ambos";
}

export const CSOSN_TABLE: CstCsosnCode[] = [
  { code: "101", description: "Tributada com permissão de crédito", productType: "normal" },
  { code: "102", description: "Tributada sem permissão de crédito", productType: "normal" },
  { code: "103", description: "Isenção do ICMS para faixa de receita bruta", productType: "normal" },
  { code: "201", description: "Tributada com permissão de crédito e com cobrança do ICMS por ST", productType: "st" },
  { code: "202", description: "Tributada sem permissão de crédito e com cobrança do ICMS por ST", productType: "st" },
  { code: "203", description: "Isenção do ICMS para faixa de receita bruta e com cobrança do ICMS por ST", productType: "st" },
  { code: "300", description: "Imune", productType: "ambos" },
  { code: "400", description: "Não tributada", productType: "ambos" },
  { code: "500", description: "ICMS cobrado anteriormente por ST ou por antecipação", productType: "st" },
  { code: "900", description: "Outros", productType: "ambos" },
];

// ─── Tabela oficial de CST ICMS (Lucro Presumido / Real) ────────────────────

export const CST_ICMS_TABLE: CstCsosnCode[] = [
  { code: "00", description: "Tributada integralmente", productType: "normal" },
  { code: "10", description: "Tributada e com cobrança do ICMS por ST", productType: "st" },
  { code: "20", description: "Com redução de base de cálculo", productType: "normal" },
  { code: "30", description: "Isenta ou não tributada e com cobrança do ICMS por ST", productType: "st" },
  { code: "40", description: "Isenta", productType: "ambos" },
  { code: "41", description: "Não tributada", productType: "ambos" },
  { code: "50", description: "Suspensão", productType: "ambos" },
  { code: "51", description: "Diferimento", productType: "normal" },
  { code: "60", description: "ICMS cobrado anteriormente por ST", productType: "st" },
  { code: "70", description: "Com redução de base de cálculo e cobrança do ICMS por ST", productType: "st" },
  { code: "90", description: "Outros", productType: "ambos" },
];

// ─── Sets para lookup rápido ────────────────────────────────────────────────

const CSOSN_SET = new Set(CSOSN_TABLE.map((c) => c.code));
const CST_ICMS_SET = new Set(CST_ICMS_TABLE.map((c) => c.code));

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type TaxRegime = "simples_nacional" | "lucro_presumido" | "lucro_real";

export interface CstCsosnValidationResult {
  valid: boolean;
  errors: CstCsosnIssue[];
  warnings: CstCsosnIssue[];
  suggestedCodes: CstCsosnCode[];
}

export interface CstCsosnIssue {
  type: "wrong_regime" | "invalid_code" | "wrong_product_type" | "missing";
  message: string;
}

// ─── Validação principal ────────────────────────────────────────────────────

/**
 * Valida CST/CSOSN conforme regime tributário da empresa.
 */
export function validateCstCsosn(params: {
  regime: TaxRegime;
  csosn?: string | null;
  cstIcms?: string | null;
  productType?: "normal" | "st";
}): CstCsosnValidationResult {
  const { regime, csosn, cstIcms, productType = "normal" } = params;
  const errors: CstCsosnIssue[] = [];
  const warnings: CstCsosnIssue[] = [];

  const isSimplesNacional = regime === "simples_nacional";

  if (isSimplesNacional) {
    // ── Simples Nacional: deve usar CSOSN ──
    if (!csosn || csosn.trim() === "") {
      errors.push({
        type: "missing",
        message: "Simples Nacional exige CSOSN. Preencha o campo CSOSN.",
      });
    } else {
      const cleaned = csosn.trim();
      if (!CSOSN_SET.has(cleaned)) {
        errors.push({
          type: "invalid_code",
          message: `CSOSN "${cleaned}" não é um código válido. Códigos aceitos: ${CSOSN_TABLE.map((c) => c.code).join(", ")}`,
        });
      } else {
        // Verificar compatibilidade com tipo de produto
        const entry = CSOSN_TABLE.find((c) => c.code === cleaned);
        if (entry && entry.productType !== "ambos" && entry.productType !== productType) {
          warnings.push({
            type: "wrong_product_type",
            message: `CSOSN "${cleaned}" (${entry.description}) é indicado para produto "${entry.productType}", mas o tipo selecionado é "${productType}".`,
          });
        }
      }
    }

    // CST ICMS não deve ser usado no Simples
    if (cstIcms && cstIcms.trim() !== "") {
      errors.push({
        type: "wrong_regime",
        message: `Simples Nacional NÃO deve usar CST ICMS ("${cstIcms}"). Remova o CST ICMS e use CSOSN.`,
      });
    }
  } else {
    // ── Lucro Presumido / Real: deve usar CST ICMS ──
    const regimeLabel = regime === "lucro_presumido" ? "Lucro Presumido" : "Lucro Real";

    if (!cstIcms || cstIcms.trim() === "") {
      errors.push({
        type: "missing",
        message: `${regimeLabel} exige CST ICMS. Preencha o campo CST ICMS.`,
      });
    } else {
      const cleaned = cstIcms.trim();
      if (!CST_ICMS_SET.has(cleaned)) {
        errors.push({
          type: "invalid_code",
          message: `CST ICMS "${cleaned}" não é um código válido. Códigos aceitos: ${CST_ICMS_TABLE.map((c) => c.code).join(", ")}`,
        });
      } else {
        const entry = CST_ICMS_TABLE.find((c) => c.code === cleaned);
        if (entry && entry.productType !== "ambos" && entry.productType !== productType) {
          warnings.push({
            type: "wrong_product_type",
            message: `CST ICMS "${cleaned}" (${entry.description}) é indicado para produto "${entry.productType}", mas o tipo selecionado é "${productType}".`,
          });
        }
      }
    }

    // CSOSN não deve ser usado fora do Simples
    if (csosn && csosn.trim() !== "") {
      errors.push({
        type: "wrong_regime",
        message: `${regimeLabel} NÃO deve usar CSOSN ("${csosn}"). Remova o CSOSN e use CST ICMS.`,
      });
    }
  }

  // Sugestões
  const suggestedCodes = getSuggestedCodes(regime, productType);

  return { valid: errors.length === 0, errors, warnings, suggestedCodes };
}

// ─── Sugestão inteligente ───────────────────────────────────────────────────

/**
 * Retorna os códigos sugeridos conforme regime e tipo de produto.
 */
export function getSuggestedCodes(
  regime: TaxRegime,
  productType: "normal" | "st" = "normal"
): CstCsosnCode[] {
  const table = regime === "simples_nacional" ? CSOSN_TABLE : CST_ICMS_TABLE;
  return table.filter(
    (c) => c.productType === productType || c.productType === "ambos"
  );
}

/**
 * Retorna descrição do código CST ou CSOSN.
 */
export function getCodeDescription(code: string, regime: TaxRegime): string | null {
  const table = regime === "simples_nacional" ? CSOSN_TABLE : CST_ICMS_TABLE;
  return table.find((c) => c.code === code)?.description ?? null;
}

/**
 * Verifica se um código é válido para o regime dado.
 */
export function isCodeValidForRegime(code: string, regime: TaxRegime): boolean {
  if (regime === "simples_nacional") {
    return CSOSN_SET.has(code);
  }
  return CST_ICMS_SET.has(code);
}
