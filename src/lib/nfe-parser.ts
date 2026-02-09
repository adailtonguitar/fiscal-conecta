/**
 * NF-e XML Parser
 * Extracts product items from Brazilian NF-e (Nota Fiscal Eletrônica) XML files.
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

function getTagText(parent: Element, tagName: string): string {
  const el = parent.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() ?? "";
}

export function parseNFeXML(xmlString: string): NFeData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("Arquivo XML inválido. Verifique se é um XML de NF-e válido.");
  }

  // Try to find the NFe node (handles namespaces)
  const nfeProc = doc.getElementsByTagName("nfeProc")[0] || doc.getElementsByTagName("NFe")[0] || doc.documentElement;
  const infNFe = nfeProc.getElementsByTagName("infNFe")[0];

  if (!infNFe) {
    throw new Error("XML não contém dados de NF-e (infNFe não encontrado).");
  }

  // Access key
  const chNFe = infNFe.getAttribute("Id")?.replace("NFe", "") ?? "";

  // Identification
  const ide = infNFe.getElementsByTagName("ide")[0];
  const nNF = ide ? getTagText(ide, "nNF") : "";
  const dhEmi = ide ? getTagText(ide, "dhEmi") : "";

  // Emitter
  const emit = infNFe.getElementsByTagName("emit")[0];
  const emitName = emit ? getTagText(emit, "xNome") : "";
  const emitCNPJ = emit ? getTagText(emit, "CNPJ") : "";

  // Items
  const detElements = infNFe.getElementsByTagName("det");
  const items: NFeItem[] = [];

  for (let i = 0; i < detElements.length; i++) {
    const det = detElements[i];
    const nItem = parseInt(det.getAttribute("nItem") ?? String(i + 1), 10);
    const prod = det.getElementsByTagName("prod")[0];

    if (!prod) continue;

    items.push({
      nItem,
      cProd: getTagText(prod, "cProd"),
      xProd: getTagText(prod, "xProd"),
      NCM: getTagText(prod, "NCM"),
      uCom: getTagText(prod, "uCom"),
      qCom: parseFloat(getTagText(prod, "qCom")) || 0,
      vUnCom: parseFloat(getTagText(prod, "vUnCom")) || 0,
      vProd: parseFloat(getTagText(prod, "vProd")) || 0,
      cEAN: getTagText(prod, "cEAN"),
      CFOP: getTagText(prod, "CFOP"),
    });
  }

  if (items.length === 0) {
    throw new Error("Nenhum item encontrado no XML da NF-e.");
  }

  // Total
  const ICMSTot = infNFe.getElementsByTagName("ICMSTot")[0];
  const totalValue = ICMSTot ? parseFloat(getTagText(ICMSTot, "vNF")) || 0 : 0;

  return { chNFe, nNF, dhEmi, emitName, emitCNPJ, items, totalValue };
}
