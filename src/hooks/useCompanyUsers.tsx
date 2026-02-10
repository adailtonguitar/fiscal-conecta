import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CompanyRole = Database["public"]["Enums"]["company_role"];

export interface CompanyUser {
  id: string;
  user_id: string;
  role: CompanyRole;
  is_active: boolean;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
}

export function useCompanyUsers() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["company-users", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("company_users")
        .select("id, user_id, role, is_active, created_at")
        .eq("company_id", companyId)
        .order("created_at");
      if (error) throw error;

      // Fetch profiles for each user
      const userIds = data.map((u) => u.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return data.map((u) => ({
        ...u,
        profile: profileMap.get(u.user_id) || null,
      })) as CompanyUser[];
    },
    enabled: !!companyId,
  });

  const updateRole = async (companyUserId: string, newRole: CompanyRole) => {
    const { error } = await supabase
      .from("company_users")
      .update({ role: newRole })
      .eq("id", companyUserId);
    if (error) {
      toast.error("Erro ao atualizar perfil");
      return;
    }
    toast.success("Perfil atualizado com sucesso");
    queryClient.invalidateQueries({ queryKey: ["company-users"] });
  };

  const toggleActive = async (companyUserId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("company_users")
      .update({ is_active: !isActive })
      .eq("id", companyUserId);
    if (error) {
      toast.error("Erro ao alterar status");
      return;
    }
    toast.success(isActive ? "Usuário desativado" : "Usuário ativado");
    queryClient.invalidateQueries({ queryKey: ["company-users"] });
  };

  const removeUser = async (companyUserId: string) => {
    const { error } = await supabase
      .from("company_users")
      .delete()
      .eq("id", companyUserId);
    if (error) {
      toast.error("Erro ao remover usuário");
      return;
    }
    toast.success("Usuário removido com sucesso");
    queryClient.invalidateQueries({ queryKey: ["company-users"] });
  };

  const updateUserName = async (userId: string, fullName: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);
    if (error) {
      toast.error("Erro ao atualizar nome");
      return;
    }
    toast.success("Nome atualizado com sucesso");
    queryClient.invalidateQueries({ queryKey: ["company-users"] });
  };

  return { users, isLoading, updateRole, toggleActive, removeUser, updateUserName };
}
