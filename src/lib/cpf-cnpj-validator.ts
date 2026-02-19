/**
 * CPF & CNPJ validation — check-digit verification + formatting utilities.
 */

function cleanDoc(value: string): string {
  return (value || "").replace(/\D/g, "");
}

// ─── CPF ────────────────────────────────────────────────────────────────────

function cpfCheckDigits(cpf: string): boolean {
  if (cpf.length !== 11) return false;
  // reject all-same digits
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (size: number): number => {
    let sum = 0;
    for (let i = 0; i < size; i++) {
      sum += parseInt(cpf[i]) * (size + 1 - i);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

export function isValidCpf(value: string): boolean {
  return cpfCheckDigits(cleanDoc(value));
}

export function formatCpf(value: string): string {
  const d = cleanDoc(value);
  if (d.length !== 11) return value;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ─── CNPJ ───────────────────────────────────────────────────────────────────

function cnpjCheckDigits(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const calc = (weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(cnpj[i]) * weights[i];
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calc(weights1) === parseInt(cnpj[12]) && calc(weights2) === parseInt(cnpj[13]);
}

export function isValidCnpj(value: string): boolean {
  return cnpjCheckDigits(cleanDoc(value));
}

export function formatCnpj(value: string): string {
  const d = cleanDoc(value);
  if (d.length !== 14) return value;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// ─── Generic ────────────────────────────────────────────────────────────────

export type DocType = "cpf" | "cnpj" | "unknown";

export function detectDocType(value: string): DocType {
  const d = cleanDoc(value);
  if (d.length === 11) return "cpf";
  if (d.length === 14) return "cnpj";
  return "unknown";
}

export interface DocValidationResult {
  valid: boolean;
  type: DocType;
  formatted: string;
  error?: string;
}

export function validateDoc(value: string): DocValidationResult {
  const d = cleanDoc(value);
  const type = detectDocType(d);

  if (type === "unknown") {
    return { valid: false, type, formatted: value, error: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos" };
  }

  if (type === "cpf") {
    const valid = isValidCpf(d);
    return {
      valid,
      type,
      formatted: formatCpf(d),
      error: valid ? undefined : "CPF inválido — dígitos verificadores não conferem",
    };
  }

  const valid = isValidCnpj(d);
  return {
    valid,
    type,
    formatted: formatCnpj(d),
    error: valid ? undefined : "CNPJ inválido — dígitos verificadores não conferem",
  };
}
