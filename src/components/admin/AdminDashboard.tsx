import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, CalendarPlus } from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    blockedCompanies: 0,
    newThisMonth: 0,
    totalUsers: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [compRes, usersRes, subsRes] = await Promise.all([
        supabase.from("companies").select("id, is_blocked, created_at"),
        supabase.from("company_users").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id, status"),
      ]);

      const companies = compRes.data ?? [];
      const active = companies.filter((c) => !c.is_blocked).length;
      const blocked = companies.filter((c) => c.is_blocked).length;
      const newMonth = companies.filter((c) => c.created_at >= firstOfMonth).length;
      const activeSubs = (subsRes.data ?? []).filter((s) => s.status === "active").length;

      setStats({
        totalCompanies: companies.length,
        activeCompanies: active,
        blockedCompanies: blocked,
        newThisMonth: newMonth,
        totalUsers: usersRes.count ?? 0,
        activeSubscriptions: activeSubs,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total de Empresas", value: stats.totalCompanies, icon: Building2, color: "text-blue-500" },
    { label: "Empresas Ativas", value: stats.activeCompanies, icon: TrendingUp, color: "text-green-500" },
    { label: "Bloqueadas", value: stats.blockedCompanies, icon: Building2, color: "text-red-500" },
    { label: "Novas este Mês", value: stats.newThisMonth, icon: CalendarPlus, color: "text-amber-500" },
    { label: "Total de Usuários", value: stats.totalUsers, icon: Users, color: "text-purple-500" },
    { label: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{c.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
