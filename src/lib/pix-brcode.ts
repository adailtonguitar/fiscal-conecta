/**
 * PIX BR Code (EMV) static payload generator.
 * Generates the "copia e cola" string for PIX payments following BCB specification.
 */

function pad(id: string, value: string): string {
  return id + String(value.length).padStart(2, "0") + value;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixPayload {
  /** PIX key (CPF, CNPJ, email, phone, or EVP/random) */
  pixKey: string;
  /** PIX key type (phone, cpf, cnpj, email, evp) */
  pixKeyType?: string;
  /** Merchant name (max 25 chars) */
  merchantName: string;
  /** Merchant city (max 15 chars) */
  merchantCity: string;
  /** Transaction amount (optional for static QR) */
  amount?: number;
  /** Transaction ID (optional, max 25 chars) */
  txId?: string;
  /** Description (optional) */
  description?: string;
}

/** Remove accents and non-ASCII characters */
function normalizeASCII(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

/** Format PIX key based on type */
function formatPixKey(key: string, keyType?: string): string {
  const cleaned = key.replace(/[\s\-().]/g, "");
  if (keyType === "phone" || (!keyType && /^\d{10,11}$/.test(cleaned))) {
    // Phone key must have +55 prefix
    if (cleaned.startsWith("+55")) return cleaned;
    if (cleaned.startsWith("55") && cleaned.length >= 12) return "+" + cleaned;
    return "+55" + cleaned;
  }
  return key;
}

/**
 * Generate a PIX BR Code (EMV) payload string.
 * This is the "copia e cola" value that can be rendered as a QR Code.
 */
export function generatePixPayload(data: PixPayload): string {
  const merchantName = normalizeASCII(data.merchantName).substring(0, 25).toUpperCase();
  const merchantCity = normalizeASCII(data.merchantCity).substring(0, 15).toUpperCase();
  const txId = (data.txId || "***").substring(0, 25);
  const pixKey = formatPixKey(data.pixKey, data.pixKeyType);

  // Merchant Account Information (ID 26)
  let mai = "";
  mai += pad("00", "br.gov.bcb.pix"); // GUI
  mai += pad("01", pixKey);            // Chave PIX
  if (data.description) {
    mai += pad("02", data.description.substring(0, 72));
  }

  let payload = "";
  payload += pad("00", "01");           // Payload Format Indicator
  payload += pad("01", "12");           // Point of Initiation (12 = static)
  payload += pad("26", mai);            // Merchant Account Information
  payload += pad("52", "0000");         // Merchant Category Code
  payload += pad("53", "986");          // Transaction Currency (BRL)

  if (data.amount && data.amount > 0) {
    payload += pad("54", data.amount.toFixed(2));
  }

  payload += pad("58", "BR");           // Country Code
  payload += pad("59", merchantName);   // Merchant Name
  payload += pad("60", merchantCity);   // Merchant City
  payload += pad("62", pad("05", txId)); // Additional Data Field

  // CRC16 placeholder
  const crcInput = payload + "6304";
  const crcValue = crc16(crcInput);
  payload += pad("63", crcValue);

  return payload;
}
