import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CompanyData {
  companyId: string | null;
  companyName: string | null;
  logoUrl: string | null;
  loading: boolean;
}

export function useCompany(): CompanyData {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanyId(null);
      setCompanyName(null);
      setLogoUrl(null);
      setLoading(false);
      return;
    }

    const fetchCompany = async () => {
      const { data: cuData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (cuData?.company_id) {
        setCompanyId(cuData.company_id);
        const { data: company } = await supabase
          .from("companies")
          .select("name, logo_url")
          .eq("id", cuData.company_id)
          .single();
        setCompanyName(company?.name ?? null);
        setLogoUrl(company?.logo_url ?? null);
      } else {
        setCompanyId(null);
      }
      setLoading(false);
    };

    fetchCompany();
  }, [user]);

  return { companyId, companyName, logoUrl, loading };
}
