import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { startOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface DashboardStats {
  salesToday: number;
  salesCountToday: number;
  ticketMedio: number;
  monthProfit: number;
  monthRevenue: number;
  monthCosts: number;
  productsAtRisk: number;
  activeAlerts: number;
  healthScore: number;
  fiscalProtected: boolean;
  recentSales: Array<{
    id: string;
    number: number | null;
    total_value: number;
    payment_method: string | null;
    status: string;
    created_at: string;
    items_json: any;
  }>;
}

export function useDashboardStats() {
  const { companyId } = useCompany();
  const today = startOfDay(new Date()).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();

  return useQuery({
    queryKey: ["dashboard-stats", companyId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!companyId) throw new Error("No company");

      // Parallel queries
      const [
        todaySalesRes,
        monthSalesRes,
        recentRes,
        productsRes,
        companyRes,
        financialRes,
      ] = await Promise.all([
        // Today's sales
        supabase
          .from("fiscal_documents")
          .select("total_value, payment_method")
          .eq("company_id", companyId)
          .eq("doc_type", "nfce")
          .gte("created_at", today),
        // Month sales
        supabase
          .from("fiscal_documents")
          .select("total_value, items_json")
          .eq("company_id", companyId)
          .eq("doc_type", "nfce")
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd),
        // Recent sales
        supabase
          .from("fiscal_documents")
          .select("id, number, total_value, payment_method, status, created_at, items_json")
          .eq("company_id", companyId)
          .eq("doc_type", "nfce")
          .order("created_at", { ascending: false })
          .limit(10),
        // Products with issues
        supabase
          .from("products")
          .select("id, name, price, cost_price, stock_quantity, min_stock, ncm, fiscal_category_id")
          .eq("company_id", companyId)
          .eq("is_active", true),
        // Company config
        supabase
          .from("companies")
          .select("modo_seguro_fiscal")
          .eq("id", companyId)
          .single(),
        // Financial entries this month
        supabase
          .from("financial_entries")
          .select("type, amount, status")
          .eq("company_id", companyId)
          .gte("due_date", format(new Date(monthStart), "yyyy-MM-dd"))
          .lte("due_date", format(new Date(monthEnd), "yyyy-MM-dd")),
      ]);

      const todaySales = todaySalesRes.data || [];
      const monthSales = monthSalesRes.data || [];
      const products = productsRes.data || [];
      const financials = financialRes.data || [];

      const salesToday = todaySales.reduce((sum, s) => sum + Number(s.total_value), 0);
      const salesCountToday = todaySales.length;
      const ticketMedio = salesCountToday > 0 ? salesToday / salesCountToday : 0;

      // Month revenue and estimated costs
      const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total_value), 0);
      
      // Calculate costs from items_json (cost_price * quantity)
      let monthCosts = 0;
      for (const sale of monthSales) {
        const items = sale.items_json as any[];
        if (items && Array.isArray(items)) {
          for (const item of items) {
            monthCosts += (item.cost_price || 0) * (item.quantity || 1);
          }
        }
      }

      const monthProfit = monthRevenue - monthCosts;

      // Products at risk: selling below cost or no NCM
      const productsAtRisk = products.filter(p => {
        const cost = Number(p.cost_price || 0);
        const price = Number(p.price);
        if (cost > 0 && price <= cost) return true;
        if (!p.ncm) return true;
        if (!p.fiscal_category_id) return true;
        return false;
      }).length;

      // Active alerts count
      let activeAlerts = 0;
      products.forEach(p => {
        const cost = Number(p.cost_price || 0);
        const price = Number(p.price);
        if (cost > 0 && price <= cost) activeAlerts++;
        if (cost > 0 && price > 0) {
          const margin = ((price - cost) / price) * 100;
          if (margin < 10 && margin > 0) activeAlerts++;
        }
        if (Number(p.stock_quantity) < Number(p.min_stock || 0) && Number(p.min_stock || 0) > 0) activeAlerts++;
      });

      // Health score (0-100)
      let score = 100;
      const totalProducts = products.length || 1;
      const riskRatio = productsAtRisk / totalProducts;
      score -= riskRatio * 40; // up to -40 for product risk
      if (!companyRes.data?.modo_seguro_fiscal) score -= 20;
      if (activeAlerts > 5) score -= 15;
      else if (activeAlerts > 0) score -= activeAlerts * 2;
      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        salesToday,
        salesCountToday,
        ticketMedio,
        monthProfit,
        monthRevenue,
        monthCosts,
        productsAtRisk,
        activeAlerts,
        healthScore: score,
        fiscalProtected: companyRes.data?.modo_seguro_fiscal ?? false,
        recentSales: recentRes.data || [],
      };
    },
    enabled: !!companyId,
    refetchInterval: 60000,
  });
}
