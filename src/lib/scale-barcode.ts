/**
 * Parser for scale-generated EAN-13 barcodes (Brazilian standard).
 *
 * Format (prefix "2"):
 *   2 C CCCC PPPPP D
 *   │ │ │    │     └─ check digit (1)
 *   │ │ │    └─────── price/weight (5 digits)
 *   │ │ └──────────── product code (4 digits)
 *   │ └────────────── type flag: 0-1 = price, 2-9 = weight
 *   └─────────────── prefix "2" (scale barcode)
 *
 * Weight is in grams (divide by 1000 → kg).
 * Price is in centavos (divide by 100 → R$).
 */

export interface ScaleBarcodeResult {
  /** The internal product code extracted from the barcode (4 digits) */
  productCode: string;
  /** Whether the value represents weight (true) or price (false) */
  isWeight: boolean;
  /** Weight in kg (only if isWeight) */
  weightKg?: number;
  /** Price in R$ (only if !isWeight) */
  priceValue?: number;
  /** Raw 5-digit value from the barcode */
  rawValue: number;
}

/**
 * Checks if a barcode is a scale-generated EAN-13 (prefix 2).
 */
export function isScaleBarcode(barcode: string): boolean {
  return /^2\d{12}$/.test(barcode.trim());
}

/**
 * Parses a scale-generated EAN-13 barcode.
 * Returns null if the barcode is not a valid scale barcode.
 */
export function parseScaleBarcode(barcode: string): ScaleBarcodeResult | null {
  const trimmed = barcode.trim();
  if (!isScaleBarcode(trimmed)) return null;

  const typeFlag = parseInt(trimmed[1], 10);
  const productCode = trimmed.substring(2, 6);
  const rawValue = parseInt(trimmed.substring(6, 11), 10);

  // Type flag 0-1 = price encoded, 2-9 = weight encoded
  const isWeight = typeFlag >= 2;

  return {
    productCode,
    isWeight,
    weightKg: isWeight ? rawValue / 1000 : undefined,
    priceValue: !isWeight ? rawValue / 100 : undefined,
    rawValue,
  };
}
