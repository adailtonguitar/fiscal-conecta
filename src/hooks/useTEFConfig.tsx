import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";

export type TEFProvider = "simulado" | "stone" | "cielo" | "rede" | "pagseguro" | "mercadopago";

export interface TEFConfig {
  id: string;
  company_id: string;
  provider: TEFProvider;
  api_key: string | null;
  api_secret: string | null;
  merchant_id: string | null;
  terminal_id: string;
  environment: "sandbox" | "production";
  auto_confirm: boolean;
  max_installments: number;
  accepted_brands: string[];
  is_active: boolean;
  hardware_model: string | null;
  connection_type: string;
}

export interface HardwareModel {
  id: string;
  label: string;
  provider: TEFProvider;
  connectionTypes: string[];
  features: string[];
}

const defaultConfig: Omit<TEFConfig, "id" | "company_id"> = {
  provider: "simulado",
  api_key: null,
  api_secret: null,
  merchant_id: null,
  terminal_id: "01",
  environment: "sandbox",
  auto_confirm: true,
  max_installments: 12,
  accepted_brands: ["visa", "mastercard", "elo", "amex", "hipercard"],
  is_active: true,
  hardware_model: null,
  connection_type: "usb",
};

export function useTEFConfig() {
  const { companyId } = useCompany();
  const [config, setConfig] = useState<TEFConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tef_configs")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (data) {
        setConfig(data as unknown as TEFConfig);
      } else {
        // Return default (simulado) if no config exists
        setConfig({
          id: "",
          company_id: companyId,
          ...defaultConfig,
        });
      }
      setLoading(false);
    };

    fetchConfig();
  }, [companyId]);

  const saveConfig = async (updates: Partial<TEFConfig>) => {
    if (!companyId) return;

    const payload = {
      company_id: companyId,
      ...updates,
    };

    if (config?.id) {
      const { data, error } = await supabase
        .from("tef_configs")
        .update(payload)
        .eq("id", config.id)
        .select()
        .single();
      if (!error && data) setConfig(data as unknown as TEFConfig);
      return { error };
    } else {
      const { data, error } = await supabase
        .from("tef_configs")
        .insert(payload)
        .select()
        .single();
      if (!error && data) setConfig(data as unknown as TEFConfig);
      return { error };
    }
  };

  return {
    config,
    loading,
    saveConfig,
    isSimulated: !config || config.provider === "simulado",
    providerLabel: getProviderLabel(config?.provider || "simulado"),
  };
}

export function getProviderLabel(provider: TEFProvider): string {
  const labels: Record<TEFProvider, string> = {
    simulado: "Simulado (sem integração)",
    stone: "Stone",
    cielo: "Cielo (API 3.0)",
    rede: "Rede (e.Rede)",
    pagseguro: "PagSeguro",
    mercadopago: "Mercado Pago (Point)",
  };
  return labels[provider] || provider;
}

export const TEF_PROVIDERS: { id: TEFProvider; label: string; description: string; requiresKey: boolean }[] = [
  { id: "simulado", label: "Simulado", description: "Simula o fluxo TEF sem conexão real — ideal para testes", requiresKey: false },
  { id: "stone", label: "Stone", description: "Integração via API REST com maquininhas Stone", requiresKey: true },
  { id: "cielo", label: "Cielo", description: "Integração via API 3.0 da Cielo", requiresKey: true },
  { id: "rede", label: "Rede", description: "Integração via e.Rede API (Itaú)", requiresKey: true },
  { id: "pagseguro", label: "PagSeguro", description: "Integração via API REST do PagSeguro", requiresKey: true },
  { id: "mercadopago", label: "Mercado Pago", description: "Integração com maquininha Point via API", requiresKey: true },
];

export const HARDWARE_MODELS: HardwareModel[] = [
  // Stone
  { id: "stone_t1", label: "Stone T1", provider: "stone", connectionTypes: ["bluetooth", "wifi"], features: ["credito", "debito", "pix", "voucher", "nfc"] },
  { id: "stone_t2", label: "Stone T2", provider: "stone", connectionTypes: ["bluetooth", "wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora"] },
  { id: "stone_t3", label: "Stone T3", provider: "stone", connectionTypes: ["bluetooth", "wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora", "camera"] },
  // Cielo
  { id: "cielo_lio_v2", label: "Cielo LIO V2", provider: "cielo", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora", "camera"] },
  { id: "cielo_lio_v3", label: "Cielo LIO V3", provider: "cielo", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora", "camera"] },
  { id: "cielo_flash", label: "Cielo Flash", provider: "cielo", connectionTypes: ["bluetooth"], features: ["credito", "debito", "nfc"] },
  { id: "cielo_zip", label: "Cielo Zip", provider: "cielo", connectionTypes: ["bluetooth", "wifi"], features: ["credito", "debito", "pix", "nfc"] },
  // Rede
  { id: "rede_pop", label: "Rede Pop", provider: "rede", connectionTypes: ["bluetooth", "wifi"], features: ["credito", "debito", "pix", "nfc"] },
  { id: "rede_smart", label: "Rede Smart", provider: "rede", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora"] },
  // PagSeguro
  { id: "pag_minizinha", label: "Minizinha", provider: "pagseguro", connectionTypes: ["bluetooth"], features: ["credito", "debito", "nfc"] },
  { id: "pag_moderninha_pro", label: "Moderninha Pro 2", provider: "pagseguro", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "nfc", "impressora"] },
  { id: "pag_smart", label: "Moderninha Smart 2", provider: "pagseguro", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora", "camera"] },
  // Mercado Pago
  { id: "mp_point_pro2", label: "Point Pro 2", provider: "mercadopago", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora"] },
  { id: "mp_point_smart", label: "Point Smart", provider: "mercadopago", connectionTypes: ["wifi", "4g"], features: ["credito", "debito", "pix", "voucher", "nfc", "impressora", "camera"] },
  { id: "mp_point_mini", label: "Point Mini NFC", provider: "mercadopago", connectionTypes: ["bluetooth"], features: ["credito", "debito", "nfc"] },
];

export const CONNECTION_TYPE_LABELS: Record<string, string> = {
  usb: "USB",
  bluetooth: "Bluetooth",
  wifi: "Wi-Fi",
  "4g": "4G/Chip",
  serial: "Serial",
};

export const FEATURE_LABELS: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  pix: "PIX",
  voucher: "Voucher",
  nfc: "NFC/Contactless",
  impressora: "Impressora",
  camera: "Câmera",
};
