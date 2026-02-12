import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

function formatBRL(cents: number): string {
  const abs = Math.abs(cents);
  const intPart = Math.floor(abs / 100);
  const decPart = String(abs % 100).padStart(2, "0");
  const formatted = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cents < 0 ? "-" : ""}${formatted},${decPart}`;
}

function parseToCents(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
}

export function CurrencyInput({ value, onChange, placeholder, className }: CurrencyInputProps) {
  const numValue = typeof value === "string" ? Math.round(parseFloat(value || "0") * 100) : Math.round((value || 0) * 100);

  const [display, setDisplay] = useState(() => formatBRL(numValue));

  // Sync display when value changes externally
  React.useEffect(() => {
    setDisplay(formatBRL(numValue));
  }, [numValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cents = parseToCents(raw);
    setDisplay(formatBRL(cents));
    onChange(cents / 100);
  }, [onChange]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder || "0,00"}
      value={display}
      onChange={handleChange}
      className={className}
    />
  );
}
