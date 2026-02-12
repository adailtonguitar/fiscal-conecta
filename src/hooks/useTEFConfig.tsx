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
