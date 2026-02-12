import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCompany } from "./useCompany";
import type { Database } from "@/integrations/supabase/types";

type CompanyRole = Database["public"]["Enums"]["company_role"];

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  role: CompanyRole | null;
  permissions: Permission[];
  loading: boolean;
  maxDiscountPercent: number;
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
}

export function usePermissions(): UserPermissions {
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [role, setRole] = useState<CompanyRole | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !companyId) {
      setRole(null);
      setPermissions([]);
      setMaxDiscountPercent(0);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Get user role
      const { data: cu } = await supabase
        .from("company_users")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .single();

      if (!cu) {
        setLoading(false);
        return;
      }

      setRole(cu.role);

      // Get permissions for role + discount limit in parallel
      const [permsResult, discountResult] = await Promise.all([
        supabase
          .from("permissions")
          .select("module, can_view, can_create, can_edit, can_delete")
          .eq("role", cu.role),
        supabase
          .from("discount_limits")
          .select("max_discount_percent")
          .eq("role", cu.role)
          .single(),
      ]);

      setPermissions(permsResult.data || []);
      setMaxDiscountPercent(discountResult.data?.max_discount_percent ?? 0);
      setLoading(false);
    };

    fetchData();
  }, [user, companyId]);

  const findPerm = useCallback(
    (module: string) => permissions.find((p) => p.module === module),
    [permissions]
  );

  return {
    role,
    permissions,
    loading,
    maxDiscountPercent,
    canView: (module: string) => findPerm(module)?.can_view ?? false,
    canCreate: (module: string) => findPerm(module)?.can_create ?? false,
    canEdit: (module: string) => findPerm(module)?.can_edit ?? false,
    canDelete: (module: string) => findPerm(module)?.can_delete ?? false,
  };
}
