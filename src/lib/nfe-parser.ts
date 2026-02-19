/**
 * NF-e XML Parser
 * Extracts product items from Brazilian NF-e (Nota Fiscal Eletrônica) XML files.
 * Handles namespaces, BOM, encoding variations, and different XML structures.
 */

export interface NFeItem {
  /** Sequential item number in the NF-e */
  nItem: number;
  /** Product code from supplier */
  cProd: string;
  /** Product name */
  xProd: string;
  /** NCM code */
  NCM: string;
  /** Unit of measure */
  uCom: string;
  /** Quantity */
  qCom: number;
  /** Unit price */
  vUnCom: number;
  /** Total value */
  vProd: number;
  /** EAN/barcode */
  cEAN: string;
  /** CFOP */
  CFOP: string;
}

export interface NFeData {
  /** NF-e access key */
  chNFe: string;
  /** NF-e number */
  nNF: string;
  /** Issue date */
  dhEmi: string;
  /** Emitter name */
  emitName: string;
  /** Emitter CNPJ */
  emitCNPJ: string;
  /** Items */
  items: NFeItem[];
  /** Total value */
  totalValue: number;
}

/**
 * Safely get text content from an element by tag name.
 * Searches with and without namespace prefix.
 */
function getTagText(parent: Element, tagName: string): string {
  // Try direct tag name first
  let el = parent.getElementsByTagName(tagName)[0];

  // Try with common NF-e namespace prefixes
  if (!el) {
    for (const prefix of ["nfe:", "ns:", "NFe:"]) {
      el = parent.getElementsByTagName(prefix + tagName)[0];
      if (el) break;
    }
  }

  // Try local name match via querySelector (handles any namespace)
  if (!el) {
    try {
      const children = parent.getElementsByTagName("*");
      for (let i = 0; i < children.length; i++) {
        if (children[i].localName === tagName) {
          el = children[i];
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  return el?.textContent?.trim() ?? "";
}

/**
 * Find element by tag name with namespace fallback
 */
function findElement(parent: Element | Document, tagName: string): Element | null {
  let el = parent.getElementsByTagName(tagName)[0];
  if (el) return el;

  // Try namespace prefixes
  for (const prefix of ["nfe:", "ns:", "NFe:"]) {
    el = parent.getElementsByTagName(prefix + tagName)[0];
    if (el) return el;
  }

  // Fallback: search by localName
  try {
    const all = parent.getElementsByTagName("*");
    for (let i = 0; i < all.length; i++) {
      if (all[i].localName === tagName) return all[i];
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Find all elements by tag name with namespace fallback
 */
function findAllElements(parent: Element, tagName: string): Element[] {
  let els = parent.getElementsByTagName(tagName);
  if (els.length > 0) return Array.from(els);

  for (const prefix of ["nfe:", "ns:", "NFe:"]) {
    els = parent.getElementsByTagName(prefix + tagName);
    if (els.length > 0) return Array.from(els);
  }

  // Fallback: search by localName
  const result: Element[] = [];
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === tagName) result.push(all[i]);
  }

  return result;
}

/**
 * Parse a number string, handling Brazilian locale (comma as decimal)
 */
function parseNum(value: string): number {
  if (!value) return 0;
  // Replace comma with dot if it looks like a decimal separator
  let str = value.trim();
  // If there's a comma and no dot after it, it's a decimal separator
  if (str.includes(",") && !str.includes(".")) {
    str = str.replace(",", ".");
  } else if (str.includes(",") && str.includes(".")) {
    // Both present: 1.234,56 format
    str = str.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Clean XML string: remove BOM, fix encoding issues
 */
function cleanXML(xmlString: string): string {
  let cleaned = xmlString;

  // Remove BOM (Byte Order Mark)
  cleaned = cleaned.replace(/^\uFEFF/, "");
  cleaned = cleaned.replace(/^\xEF\xBB\xBF/, "");

  // Remove any leading whitespace before XML declaration
  cleaned = cleaned.trimStart();

  // Fix common encoding declaration issues
  // Some XMLs declare encoding="UTF-8" but are actually ISO-8859-1
  // DOMParser handles UTF-8 by default, so we don't need to change encoding

  return cleaned;
}

export function parseNFeXML(xmlString: string): NFeData {
  const cleaned = cleanXML(xmlString);

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleaned, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("[NFeParser] Parse error:", parseError.textContent);
    throw new Error("Arquivo XML inválido. Verifique se é um XML de NF-e válido.");
  }

  // Try to find infNFe node (handles various structures and namespaces)
  const infNFe = findElement(doc, "infNFe");

  if (!infNFe) {
    // Log available root elements for debugging
    const rootTag = doc.documentElement?.tagName || "unknown";
    const childTags = Array.from(doc.documentElement?.children || []).map(c => c.tagName).join(", ");
    console.error(`[NFeParser] infNFe not found. Root: ${rootTag}, Children: ${childTags}`);
    throw new Error("XML não contém dados de NF-e (infNFe não encontrado). Verifique se o arquivo é uma NF-e válida.");
  }

  // Access key
  const chNFe = infNFe.getAttribute("Id")?.replace(/^NFe/, "") ?? "";

  // Identification
  const ide = findElement(infNFe, "ide");
  const nNF = ide ? getTagText(ide, "nNF") : "";
  const dhEmi = ide ? getTagText(ide, "dhEmi") : "";

  // Emitter
  const emit = findElement(infNFe, "emit");
  const emitName = emit ? getTagText(emit, "xNome") : "";
  const emitCNPJ = emit ? getTagText(emit, "CNPJ") : "";

  // Items - find all <det> elements
  const detElements = findAllElements(infNFe, "det");
  const items: NFeItem[] = [];

  for (let i = 0; i < detElements.length; i++) {
    const det = detElements[i];
    const nItem = parseInt(det.getAttribute("nItem") ?? String(i + 1), 10);
    const prod = findElement(det, "prod");

    if (!prod) continue;

    const xProd = getTagText(prod, "xProd");
    if (!xProd) continue; // Skip items without a product name

    items.push({
      nItem,
      cProd: getTagText(prod, "cProd"),
      xProd,
      NCM: getTagText(prod, "NCM"),
      uCom: getTagText(prod, "uCom") || getTagText(prod, "uTrib") || "UN",
      qCom: parseNum(getTagText(prod, "qCom")) || parseNum(getTagText(prod, "qTrib")) || 0,
      vUnCom: parseNum(getTagText(prod, "vUnCom")) || parseNum(getTagText(prod, "vUnTrib")) || 0,
      vProd: parseNum(getTagText(prod, "vProd")) || 0,
      cEAN: getTagText(prod, "cEAN") || getTagText(prod, "cEANTrib") || "",
      CFOP: getTagText(prod, "CFOP"),
    });
  }

  if (items.length === 0) {
    throw new Error("Nenhum item encontrado no XML da NF-e. Verifique se o arquivo contém produtos.");
  }

  // Total
  const ICMSTot = findElement(infNFe, "ICMSTot");
  const totalValue = ICMSTot ? parseNum(getTagText(ICMSTot, "vNF")) : 0;

  console.log(`[NFeParser] Parsed successfully: NF-e ${nNF}, ${items.length} items, total ${totalValue}`);

  return { chNFe, nNF, dhEmi, emitName, emitCNPJ, items, totalValue };
}
