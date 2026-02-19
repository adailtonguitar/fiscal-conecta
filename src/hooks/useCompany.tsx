import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CompanyData {
  companyId: string | null;
  companyName: string | null;
  logoUrl: string | null;
  slogan: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
  pixCity: string | null;
  loading: boolean;
}

export function useCompany(): CompanyData {
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [slogan, setSlogan] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [pixKeyType, setPixKeyType] = useState<string | null>(null);
  const [pixCity, setPixCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    retryCount.current = 0;
    if (retryTimer.current) clearTimeout(retryTimer.current);

    if (!user) {
      setCompanyId(null);
      setCompanyName(null);
      setLogoUrl(null);
      setSlogan(null);
      setPixKey(null);
      setPixKeyType(null);
      setPixCity(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCompany = async () => {
      try {
        const { data: cuData, error: cuError } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (cancelled) return;

        if (cuError || !cuData?.company_id) {
          // Retry up to 3 times with increasing delay
          if (retryCount.current < 3) {
            retryCount.current++;
            const delay = retryCount.current * 1500;
            console.warn(`[useCompany] Retry ${retryCount.current}/3 in ${delay}ms`);
            retryTimer.current = setTimeout(() => {
              if (!cancelled) fetchCompany();
            }, delay);
            return;
          }
          setCompanyId(null);
          setLoading(false);
          return;
        }

        setCompanyId(cuData.company_id);

        const { data: company } = await supabase
          .from("companies")
          .select("name, logo_url, slogan, pix_key, pix_key_type, pix_city, address_city")
          .eq("id", cuData.company_id)
          .single();

        if (cancelled) return;

        setCompanyName(company?.name ?? null);
        setLogoUrl(company?.logo_url ?? null);
        setSlogan((company as any)?.slogan ?? null);
        setPixKey((company as any)?.pix_key ?? null);
        setPixKeyType((company as any)?.pix_key_type ?? null);
        setPixCity((company as any)?.pix_city || (company as any)?.address_city || null);
      } catch (err) {
        console.error("[useCompany] Failed to fetch company:", err);
        if (!cancelled && retryCount.current < 3) {
          retryCount.current++;
          retryTimer.current = setTimeout(() => {
            if (!cancelled) fetchCompany();
          }, retryCount.current * 1500);
          return;
        }
        setCompanyId(null);
      }
      if (!cancelled) setLoading(false);
    };

    fetchCompany();

    return () => {
      cancelled = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [user]);

  return { companyId, companyName, logoUrl, slogan, pixKey, pixKeyType, pixCity, loading };
}
