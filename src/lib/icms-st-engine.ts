/**
 * ICMS-ST Engine — Motor de cálculo e detecção de Substituição Tributária.
 *
 * Funcionalidades:
 * 1. Tabela de NCMs típicos de ST (bebidas, cigarros, combustíveis etc.)
 * 2. Cálculo automático de ICMS-ST com MVA original e ajustado
 * 3. Detecção de produtos que deveriam ter ST mas não têm
 */

/** NCMs que tipicamente possuem ST na maioria dos estados brasileiros */
export const ST_TYPICAL_NCMS: Record<string, { description: string; segments: string[] }> = {
  // Bebidas
  "22021000": { description: "Água mineral com gás", segments: ["Bebidas"] },
  "22011000": { description: "Água mineral sem gás", segments: ["Bebidas"] },
  "22021090": { description: "Águas minerais aromatizadas", segments: ["Bebidas"] },
  "22029000": { description: "Outras águas com adição de açúcar", segments: ["Bebidas"] },
  "22021010": { description: "Refrigerante", segments: ["Bebidas"] },
  "22021020": { description: "Refrescos", segments: ["Bebidas"] },
  "22030000": { description: "Cerveja de malte", segments: ["Bebidas"] },
  "22041000": { description: "Vinhos espumantes", segments: ["Bebidas"] },
  "22082000": { description: "Aguardente/destilados", segments: ["Bebidas"] },
  "22060010": { description: "Cervejas sem álcool", segments: ["Bebidas"] },
  // Cigarros
  "24022000": { description: "Cigarros com tabaco", segments: ["Tabaco"] },
  "24021000": { description: "Charutos", segments: ["Tabaco"] },
  // Combustíveis
  "27101259": { description: "Gasolina", segments: ["Combustíveis"] },
  "27101921": { description: "Diesel", segments: ["Combustíveis"] },
  "27111300": { description: "GLP", segments: ["Combustíveis"] },
  // Autopeças
  "40111000": { description: "Pneus novos para automóveis", segments: ["Autopeças"] },
  "40112000": { description: "Pneus para ônibus/caminhões", segments: ["Autopeças"] },
  // Tintas e vernizes
  "32091000": { description: "Tintas à base de polímeros", segments: ["Tintas"] },
  "32081000": { description: "Tintas a base de poliésteres", segments: ["Tintas"] },
  // Materiais de construção
  "69072100": { description: "Ladrilhos/placas cerâmicas", segments: ["Mat. Construção"] },
  "73061100": { description: "Tubos de aço soldados", segments: ["Mat. Construção"] },
  // Medicamentos
  "30049099": { description: "Medicamentos (outros)", segments: ["Medicamentos"] },
  "30042099": { description: "Medicamentos com antibióticos", segments: ["Medicamentos"] },
  // Produtos de limpeza
  "34011190": { description: "Sabões em barra", segments: ["Limpeza"] },
  "34022000": { description: "Detergentes", segments: ["Limpeza"] },
  // Produtos de higiene
  "33030000": { description: "Perfumes e águas de toalete", segments: ["Higiene"] },
  "33051000": { description: "Xampus", segments: ["Higiene"] },
  "96190000": { description: "Absorventes", segments: ["Higiene"] },
  // Alimentos
  "19053100": { description: "Biscoitos doces", segments: ["Alimentos"] },
  "19053200": { description: "Waffles", segments: ["Alimentos"] },
  "20079910": { description: "Doces/geleias", segments: ["Alimentos"] },
  "04012010": { description: "Leite UHT", segments: ["Alimentos"] },
  "21069090": { description: "Preparações alimentícias", segments: ["Alimentos"] },
};

/** Check if an NCM is typically subject to ST */
export function isTypicalStNcm(ncm: string | null | undefined): {
  isTypical: boolean;
  description?: string;
  segments?: string[];
} {
  if (!ncm) return { isTypical: false };
  const cleaned = ncm.replace(/\D/g, "").trim();
  const match = ST_TYPICAL_NCMS[cleaned];
  if (match) return { isTypical: true, ...match };

  // Also check by first 4 digits (chapter/position)
  const prefix4 = cleaned.substring(0, 4);
  const ST_PREFIXES: Record<string, string> = {
    "2202": "Bebidas não alcoólicas",
    "2203": "Cervejas",
    "2204": "Vinhos",
    "2208": "Destilados",
    "2402": "Cigarros/tabaco",
    "2710": "Combustíveis derivados de petróleo",
    "2711": "Gás liquefeito",
    "4011": "Pneus",
  };
  if (ST_PREFIXES[prefix4]) {
    return { isTypical: true, description: ST_PREFIXES[prefix4], segments: [] };
  }

  return { isTypical: false };
}

/**
 * Detect products that should have ST but don't.
 */
export function detectMissingSt(
  products: Array<{
    id: string;
    name: string;
    ncm?: string | null;
    product_type?: string;
    fiscal_category_id?: string | null;
  }>,
  fiscalCategories: Array<{ id: string; product_type: string }>
): Array<{ product: string; ncm: string; stInfo: string }> {
  const alerts: Array<{ product: string; ncm: string; stInfo: string }> = [];

  for (const p of products) {
    const stCheck = isTypicalStNcm(p.ncm);
    if (!stCheck.isTypical) continue;

    // Check if product is already marked as ST
    const isAlreadySt =
      p.product_type === "st" ||
      (p.fiscal_category_id &&
        fiscalCategories.find((c) => c.id === p.fiscal_category_id)?.product_type === "st");

    if (!isAlreadySt) {
      alerts.push({
        product: p.name,
        ncm: p.ncm || "",
        stInfo: stCheck.description || "NCM típico de ST",
      });
    }
  }

  return alerts;
}

/**
 * ICMS-ST Calculation Interface
 */
export interface IcmsStCalculationInput {
  /** Valor do produto (preço de venda) */
  productValue: number;
  /** Valor do IPI (se aplicável) */
  ipiValue?: number;
  /** Valor do frete (se aplicável) */
  freightValue?: number;
  /** Outras despesas */
  otherExpenses?: number;
  /** MVA Original (%) */
  mvaOriginal: number;
  /** MVA Ajustado (%) — se interestadual */
  mvaAdjusted?: number;
  /** Alíquota ICMS próprio (%) — ex: 18% */
  icmsOwnRate: number;
  /** Alíquota ICMS interno do estado destino (%) */
  icmsInternalRate: number;
  /** Alíquota interestadual (%) — ex: 12%, 7%, 4% */
  icmsInterstateRate?: number;
  /** Se é operação interestadual */
  isInterstate: boolean;
}

export interface IcmsStCalculationResult {
  /** Base de cálculo do ICMS próprio */
  bcIcmsOwn: number;
  /** Valor do ICMS próprio */
  icmsOwn: number;
  /** MVA utilizado (original ou ajustado) */
  mvaUsed: number;
  /** Base de cálculo do ICMS-ST */
  bcIcmsSt: number;
  /** Valor do ICMS-ST */
  icmsSt: number;
  /** Valor total com ST */
  totalWithSt: number;
}

/**
 * Calculate ICMS-ST value.
 *
 * Fórmula:
 * BC ST = (Valor produto + IPI + Frete + Outras) × (1 + MVA%)
 * ICMS ST = (BC ST × Alíq interna) – ICMS próprio
 */
export function calculateIcmsSt(input: IcmsStCalculationInput): IcmsStCalculationResult {
  const baseValue =
    input.productValue +
    (input.ipiValue || 0) +
    (input.freightValue || 0) +
    (input.otherExpenses || 0);

  // ICMS próprio
  const rateOwn = input.isInterstate
    ? (input.icmsInterstateRate || input.icmsOwnRate) / 100
    : input.icmsOwnRate / 100;
  const bcIcmsOwn = baseValue;
  const icmsOwn = bcIcmsOwn * rateOwn;

  // MVA — use adjusted for interstate, original for internal
  const mvaUsed = input.isInterstate && input.mvaAdjusted != null
    ? input.mvaAdjusted
    : input.mvaOriginal;

  // BC ST
  const bcIcmsSt = baseValue * (1 + mvaUsed / 100);

  // ICMS ST
  const icmsStTotal = bcIcmsSt * (input.icmsInternalRate / 100);
  const icmsSt = Math.max(0, icmsStTotal - icmsOwn);

  return {
    bcIcmsOwn: Math.round(bcIcmsOwn * 100) / 100,
    icmsOwn: Math.round(icmsOwn * 100) / 100,
    mvaUsed,
    bcIcmsSt: Math.round(bcIcmsSt * 100) / 100,
    icmsSt: Math.round(icmsSt * 100) / 100,
    totalWithSt: Math.round((baseValue + icmsSt) * 100) / 100,
  };
}

/**
 * Calculate adjusted MVA for interstate operations.
 * Formula: MVA ajustado = [(1 + MVA-ST original) × (1 – ALQ inter) / (1 – ALQ intra)] – 1
 */
export function calculateAdjustedMva(
  mvaOriginal: number,
  aliqInterstate: number,
  aliqInternal: number
): number {
  if (aliqInternal >= 100) return mvaOriginal; // prevent division by zero
  const adjusted =
    ((1 + mvaOriginal / 100) * (1 - aliqInterstate / 100)) /
    (1 - aliqInternal / 100) -
    1;
  return Math.round(adjusted * 10000) / 100; // Return as percentage with 2 decimals
}

/** UF list for Brazilian states */
export const BRAZILIAN_UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;
