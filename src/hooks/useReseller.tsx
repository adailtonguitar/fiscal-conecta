import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Reseller {
  id: string;
  owner_user_id: string;
  name: string;
  trade_name: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
  markup_percentage: number;
  whatsapp_support: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResellerPlan {
  id: string;
  reseller_id: string;
  name: string;
  description: string | null;
  max_users: number;
  max_products: number;
  max_monthly_sales: number | null;
  base_price: number;
  reseller_price: number;
  is_active: boolean;
  created_at: string;
}

export interface ResellerLicense {
  id: string;
  reseller_id: string;
  plan_id: string;
  company_id: string;
  status: string;
  trial_ends_at: string | null;
  started_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface ResellerCommission {
  id: string;
  reseller_id: string;
  license_id: string;
  period_start: string;
  period_end: string;
  base_amount: number;
  markup_amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export function useReseller() {
  const { user } = useAuth();
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [plans, setPlans] = useState<ResellerPlan[]>([]);
  const [licenses, setLicenses] = useState<ResellerLicense[]>([]);
  const [commissions, setCommissions] = useState<ResellerCommission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReseller = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("resellers")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setReseller(data as Reseller | null);

      if (data) {
        const [plansRes, licensesRes, commissionsRes] = await Promise.all([
          supabase.from("reseller_plans").select("*").eq("reseller_id", data.id).order("created_at", { ascending: false }),
          supabase.from("reseller_licenses").select("*").eq("reseller_id", data.id).order("created_at", { ascending: false }),
          supabase.from("reseller_commissions").select("*").eq("reseller_id", data.id).order("period_start", { ascending: false }),
        ]);

        if (plansRes.data) setPlans(plansRes.data as ResellerPlan[]);
        if (licensesRes.data) setLicenses(licensesRes.data as ResellerLicense[]);
        if (commissionsRes.data) setCommissions(commissionsRes.data as ResellerCommission[]);
      }
    } catch (err) {
      console.error("Error fetching reseller:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReseller();
  }, [fetchReseller]);

  const createReseller = async (data: { name: string; email?: string; cnpj?: string; phone?: string; trade_name?: string; brand_name?: string; primary_color?: string }) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("resellers").insert({
        owner_user_id: user.id,
        name: data.name,
        email: data.email || null,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        trade_name: data.trade_name || null,
        brand_name: data.brand_name || "AnthoSystem",
        primary_color: data.primary_color || "#1a9e7a",
      });
      if (error) throw error;
      toast.success("Revenda criada com sucesso!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao criar revenda: " + err.message);
    }
  };

  const updateReseller = async (updates: Partial<Reseller>) => {
    if (!reseller) return;
    try {
      const { error } = await supabase.from("resellers").update(updates).eq("id", reseller.id);
      if (error) throw error;
      toast.success("Revenda atualizada!");
      await fetchReseller(false);
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    }
  };

  const createPlan = async (plan: { name: string; description?: string; max_users: number; max_products: number; base_price: number; reseller_price: number }) => {
    if (!reseller) return;
    try {
      const { error } = await supabase.from("reseller_plans").insert({
        reseller_id: reseller.id,
        ...plan,
      });
      if (error) throw error;
      toast.success("Plano criado!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao criar plano: " + err.message);
    }
  };

  const updatePlan = async (planId: string, updates: Partial<ResellerPlan>) => {
    try {
      const { error } = await supabase.from("reseller_plans").update(updates).eq("id", planId);
      if (error) throw error;
      toast.success("Plano atualizado!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao atualizar plano: " + err.message);
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase.from("reseller_plans").delete().eq("id", planId);
      if (error) throw error;
      toast.success("Plano removido!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao remover plano: " + err.message);
    }
  };

  const createLicense = async (data: { plan_id: string; company_id: string; status?: string }) => {
    if (!reseller) return;
    try {
      const { error } = await supabase.from("reseller_licenses").insert({
        reseller_id: reseller.id,
        ...data,
      });
      if (error) throw error;
      toast.success("Licença criada!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao criar licença: " + err.message);
    }
  };

  const updateLicense = async (licenseId: string, updates: Partial<ResellerLicense>) => {
    try {
      const { error } = await supabase.from("reseller_licenses").update(updates).eq("id", licenseId);
      if (error) throw error;
      toast.success("Licença atualizada!");
      await fetchReseller();
    } catch (err: any) {
      toast.error("Erro ao atualizar licença: " + err.message);
    }
  };

  return {
    reseller,
    plans,
    licenses,
    commissions,
    loading,
    createReseller,
    updateReseller,
    createPlan,
    updatePlan,
    deletePlan,
    createLicense,
    updateLicense,
    refetch: fetchReseller,
  };
}
