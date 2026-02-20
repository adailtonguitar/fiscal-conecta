import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LoyaltyConfig {
  id: string;
  company_id: string;
  is_active: boolean;
  points_per_real: number;
  redemption_value: number;
  min_redemption_points: number;
  welcome_bonus: number;
  birthday_multiplier: number;
}

export interface LoyaltyTransaction {
  id: string;
  client_id: string;
  type: "earn" | "redeem" | "bonus" | "expire" | "adjust";
  points: number;
  balance_after: number;
  description: string | null;
  sale_id: string | null;
  created_at: string;
}

export interface ClientWithPoints {
  id: string;
  name: string;
  cpf_cnpj: string | null;
  phone: string | null;
  loyalty_points: number;
}

export function useLoyalty() {
  const { companyId } = useCompany();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["loyalty-config", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("loyalty_config")
        .select("*")
        .eq("company_id", companyId)
        .single();
      return data as LoyaltyConfig | null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const { data: topClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["loyalty-top-clients", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("clients")
        .select("id, name, cpf_cnpj, phone, loyalty_points")
        .eq("company_id", companyId)
        .gt("loyalty_points", 0)
        .order("loyalty_points", { ascending: false })
        .limit(50);
      return (data || []) as ClientWithPoints[];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 min cache
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["loyalty-transactions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as LoyaltyTransaction[];
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 min cache
  });

  const saveConfig = async (values: Partial<LoyaltyConfig>) => {
    if (!companyId) return;
    if (config) {
      const { error } = await supabase
        .from("loyalty_config")
        .update(values)
        .eq("id", config.id);
      if (error) { toast.error("Erro ao salvar configuração"); return; }
    } else {
      const { error } = await supabase
        .from("loyalty_config")
        .insert({ company_id: companyId, ...values });
      if (error) { toast.error("Erro ao criar configuração"); return; }
    }
    toast.success("Configuração de fidelidade salva!");
    queryClient.invalidateQueries({ queryKey: ["loyalty-config"] });
  };

  const earnPoints = async (clientId: string, saleTotal: number, saleId?: string) => {
    if (!companyId || !config || !config.is_active || !user) return 0;
    const points = Math.floor(saleTotal * config.points_per_real);
    if (points <= 0) return 0;

    // Get current balance
    const { data: client } = await supabase
      .from("clients")
      .select("loyalty_points")
      .eq("id", clientId)
      .single();

    const currentPoints = client?.loyalty_points || 0;
    const newBalance = currentPoints + points;

    // Insert transaction
    await supabase.from("loyalty_transactions").insert({
      company_id: companyId,
      client_id: clientId,
      type: "earn",
      points,
      balance_after: newBalance,
      description: `Compra de R$ ${saleTotal.toFixed(2)}`,
      sale_id: saleId || null,
      created_by: user.id,
    });

    // Update client balance
    await supabase
      .from("clients")
      .update({ loyalty_points: newBalance })
      .eq("id", clientId);

    queryClient.invalidateQueries({ queryKey: ["loyalty-top-clients"] });
    queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    return points;
  };

  const redeemPoints = async (clientId: string, points: number) => {
    if (!companyId || !config || !user) return 0;
    if (points < config.min_redemption_points) {
      toast.error(`Mínimo de ${config.min_redemption_points} pontos para resgate`);
      return 0;
    }

    const { data: client } = await supabase
      .from("clients")
      .select("loyalty_points")
      .eq("id", clientId)
      .single();

    const currentPoints = client?.loyalty_points || 0;
    if (points > currentPoints) {
      toast.error("Pontos insuficientes");
      return 0;
    }

    const newBalance = currentPoints - points;
    const discount = points * config.redemption_value;

    await supabase.from("loyalty_transactions").insert({
      company_id: companyId,
      client_id: clientId,
      type: "redeem",
      points: -points,
      balance_after: newBalance,
      description: `Resgate de ${points} pts = R$ ${discount.toFixed(2)}`,
      created_by: user.id,
    });

    await supabase
      .from("clients")
      .update({ loyalty_points: newBalance })
      .eq("id", clientId);

    queryClient.invalidateQueries({ queryKey: ["loyalty-top-clients"] });
    queryClient.invalidateQueries({ queryKey: ["loyalty-transactions"] });
    toast.success(`${points} pontos resgatados = R$ ${discount.toFixed(2)} de desconto`);
    return discount;
  };

  const getClientTransactions = async (clientId: string) => {
    if (!companyId) return [];
    const { data } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("company_id", companyId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data || []) as LoyaltyTransaction[];
  };

  return {
    config,
    configLoading,
    topClients,
    clientsLoading,
    recentTransactions,
    transactionsLoading,
    saveConfig,
    earnPoints,
    redeemPoints,
    getClientTransactions,
    isActive: config?.is_active ?? false,
  };
}
