/**
 * ESC/POS thermal printer commands generator.
 * This module creates byte arrays for ESC/POS compatible printers.
 * In a Capacitor native app, these bytes are sent via USB/serial plugin.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export interface ReceiptLine {
  text: string;
  bold?: boolean;
  center?: boolean;
  doubleWidth?: boolean;
  doubleHeight?: boolean;
}

export interface ReceiptData {
  storeName: string;
  cnpj: string;
  address: string;
  slogan?: string;
  items: Array<{ name: string; qty: number; price: number }>;
  total: number;
  paymentMethod: string;
  nfceNumber: string;
  date: Date;
  accessKey?: string;
}

function textToBytes(text: string): number[] {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

function cmd(...bytes: number[]): number[] {
  return bytes;
}

export function buildReceipt(data: ReceiptData): Uint8Array {
  const lines: number[] = [];

  // Initialize printer
  lines.push(...cmd(ESC, 0x40)); // Reset

  // Center align
  lines.push(...cmd(ESC, 0x61, 1));

  // Store name (bold, double width)
  lines.push(...cmd(ESC, 0x45, 1)); // Bold on
  lines.push(...cmd(GS, 0x21, 0x10)); // Double width
  lines.push(...textToBytes(data.storeName));
  lines.push(LF);
  lines.push(...cmd(GS, 0x21, 0x00)); // Normal size
  lines.push(...cmd(ESC, 0x45, 0)); // Bold off

  // Slogan
  if (data.slogan) {
    lines.push(...textToBytes(data.slogan));
    lines.push(LF);
  }

  // CNPJ & address
  lines.push(...textToBytes(`CNPJ: ${data.cnpj}`));
  lines.push(LF);
  lines.push(...textToBytes(data.address));
  lines.push(LF);

  // Separator
  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  // Left align for items
  lines.push(...cmd(ESC, 0x61, 0));

  // NFC-e header
  lines.push(...cmd(ESC, 0x45, 1));
  lines.push(...textToBytes(`NFC-e #${data.nfceNumber}`));
  lines.push(LF);
  lines.push(...cmd(ESC, 0x45, 0));
  lines.push(...textToBytes(data.date.toLocaleString("pt-BR")));
  lines.push(LF);
  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  // Column headers
  lines.push(...textToBytes("ITEM                      QTD   VALOR"));
  lines.push(LF);
  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  // Items
  for (const item of data.items) {
    const name = item.name.substring(0, 24).padEnd(24);
    const qty = String(item.qty).padStart(4);
    const price = (item.price * item.qty).toFixed(2).padStart(10);
    lines.push(...textToBytes(`${name}  ${qty} ${price}`));
    lines.push(LF);
  }

  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  // Total
  lines.push(...cmd(ESC, 0x45, 1));
  lines.push(...cmd(GS, 0x21, 0x10));
  const totalStr = `TOTAL: R$ ${data.total.toFixed(2)}`;
  lines.push(...textToBytes(totalStr));
  lines.push(LF);
  lines.push(...cmd(GS, 0x21, 0x00));
  lines.push(...cmd(ESC, 0x45, 0));

  // Payment method
  lines.push(...textToBytes(`Pagamento: ${data.paymentMethod}`));
  lines.push(LF);

  // Access key (if available)
  if (data.accessKey) {
    lines.push(LF);
    lines.push(...cmd(ESC, 0x61, 1));
    lines.push(...textToBytes("Chave de Acesso:"));
    lines.push(LF);
    lines.push(...textToBytes(data.accessKey));
    lines.push(LF);
  }

  // Footer
  lines.push(LF);
  lines.push(...cmd(ESC, 0x61, 1));
  lines.push(...textToBytes("Obrigado pela preferencia!"));
  lines.push(LF);
  lines.push(LF);

  // Cut paper
  lines.push(...cmd(GS, 0x56, 0x41, 3));

  // Open cash drawer (pulse pin 2)
  lines.push(...cmd(ESC, 0x70, 0, 25, 250));

  return new Uint8Array(lines);
}

/**
 * Open cash drawer via ESC/POS command.
 * Supports configurable pin and pulse duration for different drawer models.
 * 
 * @param pin - Drawer kick-out connector pin (0 = pin 2, 1 = pin 5). Default: 0
 * @param onTime - Pulse ON time (units of 2ms). Default: 25 (50ms)
 * @param offTime - Pulse OFF time (units of 2ms). Default: 250 (500ms)
 */
export function buildOpenDrawerCommand(pin = 0, onTime = 25, offTime = 250): Uint8Array {
  return new Uint8Array([ESC, 0x70, pin, onTime, offTime]);
}

/** Preset drawer commands for common models */
export const DRAWER_PRESETS: Record<string, { label: string; pin: number; onTime: number; offTime: number }> = {
  padrao: { label: "Padrão (Pin 2)", pin: 0, onTime: 25, offTime: 250 },
  pin5: { label: "Pin 5", pin: 1, onTime: 25, offTime: 250 },
  bematech: { label: "Bematech", pin: 0, onTime: 50, offTime: 250 },
  epson: { label: "Epson", pin: 0, onTime: 25, offTime: 250 },
  elgin: { label: "Elgin", pin: 0, onTime: 40, offTime: 200 },
  daruma: { label: "Daruma", pin: 1, onTime: 30, offTime: 250 },
};

/**
 * Send open drawer command to printer.
 * In a Capacitor native app, this would be sent via USB plugin.
 * In web context, this logs and simulates the action.
 */
export function openCashDrawer(preset: keyof typeof DRAWER_PRESETS = "padrao"): void {
  const config = DRAWER_PRESETS[preset] || DRAWER_PRESETS.padrao;
  const command = buildOpenDrawerCommand(config.pin, config.onTime, config.offTime);
  
  // In a real Capacitor app, send via USB plugin:
  // await USBPrinter.sendData({ data: Array.from(command) });
  
  console.log(`[ESC/POS] Gaveta aberta (${config.label}) - comando:`, Array.from(command));
}

export interface CreditReceiptInput {
  clientName: string;
  clientDoc?: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: string;
  storeName?: string;
  storeCnpj?: string;
  storeSlogan?: string;
  date: Date;
}

/**
 * Build ESC/POS receipt for credit payment (recebimento de fiado).
 */
export function buildCreditReceipt(data: CreditReceiptInput): Uint8Array {
  const lines: number[] = [];

  // Initialize
  lines.push(...cmd(ESC, 0x40));

  // Center
  lines.push(...cmd(ESC, 0x61, 1));

  // Title
  lines.push(...cmd(ESC, 0x45, 1));
  lines.push(...cmd(GS, 0x21, 0x10));
  lines.push(...textToBytes("RECIBO DE RECEBIMENTO"));
  lines.push(LF);
  lines.push(...cmd(GS, 0x21, 0x00));
  lines.push(...cmd(ESC, 0x45, 0));

  if (data.storeName) {
    lines.push(...textToBytes(data.storeName));
    lines.push(LF);
  }
  if (data.storeSlogan) {
    lines.push(...textToBytes(data.storeSlogan));
    lines.push(LF);
  }
  if (data.storeCnpj) {
    lines.push(...textToBytes(`CNPJ: ${data.storeCnpj}`));
    lines.push(LF);
  }

  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);
  lines.push(...textToBytes(data.date.toLocaleString("pt-BR")));
  lines.push(LF);
  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  // Left align
  lines.push(...cmd(ESC, 0x61, 0));

  lines.push(...cmd(ESC, 0x45, 1));
  lines.push(...textToBytes(`Cliente: ${data.clientName}`));
  lines.push(LF);
  lines.push(...cmd(ESC, 0x45, 0));

  if (data.clientDoc) {
    lines.push(...textToBytes(`Doc: ${data.clientDoc}`));
    lines.push(LF);
  }

  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);

  const fmt = (v: number) => `R$ ${v.toFixed(2)}`;
  lines.push(...textToBytes(`Saldo anterior:    ${fmt(data.previousBalance)}`));
  lines.push(LF);

  lines.push(...cmd(ESC, 0x45, 1));
  lines.push(...cmd(GS, 0x21, 0x10));
  lines.push(...textToBytes(`Valor recebido:    ${fmt(data.amount)}`));
  lines.push(LF);
  lines.push(...cmd(GS, 0x21, 0x00));
  lines.push(...cmd(ESC, 0x45, 0));

  lines.push(...textToBytes(`Saldo remanescente: ${fmt(data.newBalance)}`));
  lines.push(LF);
  lines.push(...textToBytes("-".repeat(48)));
  lines.push(LF);
  lines.push(...textToBytes(`Forma: ${data.paymentMethod}`));
  lines.push(LF);
  lines.push(LF);

  // Center footer
  lines.push(...cmd(ESC, 0x61, 1));
  lines.push(...textToBytes("Obrigado!"));
  lines.push(LF);
  lines.push(LF);

  // Cut
  lines.push(...cmd(GS, 0x56, 0x41, 3));

  return new Uint8Array(lines);
}
