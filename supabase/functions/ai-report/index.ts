import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { report_type, company_id } = await req.json();
    if (!company_id) throw new Error("company_id is required");

    // Verify user belongs to company
    const { data: membership } = await supabase
      .from("company_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", company_id)
      .eq("is_active", true)
      .single();
    if (!membership) throw new Error("Access denied");

    // Gather data based on report type
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    let contextData: Record<string, unknown> = {};

    // Sales data (last 30 days)
    const { data: recentSales } = await supabase
      .from("fiscal_documents")
      .select("total_value, payment_method, created_at, items_json, status")
      .eq("company_id", company_id)
      .gte("created_at", thirtyDaysAgo)
      .eq("status", "autorizada")
      .order("created_at", { ascending: false })
      .limit(500);

    contextData.sales = {
      total_count: recentSales?.length || 0,
      total_revenue: recentSales?.reduce((sum, s) => sum + Number(s.total_value), 0) || 0,
      by_payment: groupBy(recentSales || [], "payment_method"),
      daily: groupByDate(recentSales || []),
    };

    // Products data
    const { data: products } = await supabase
      .from("products")
      .select("name, price, cost_price, stock_quantity, min_stock, unit, category")
      .eq("company_id", company_id)
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true })
      .limit(200);

    const lowStock = (products || []).filter(
      (p) => p.min_stock != null && p.stock_quantity <= p.min_stock
    );
    const zeroStock = (products || []).filter((p) => p.stock_quantity <= 0);

    contextData.products = {
      total_active: products?.length || 0,
      low_stock_count: lowStock.length,
      low_stock_items: lowStock.slice(0, 10).map((p) => `${p.name} (${p.stock_quantity} ${p.unit})`),
      zero_stock_count: zeroStock.length,
      zero_stock_items: zeroStock.slice(0, 5).map((p) => p.name),
      avg_margin: calcAvgMargin(products || []),
    };

    // Financial entries (last 30 days)
    const { data: financial } = await supabase
      .from("financial_entries")
      .select("type, amount, status, category, due_date, paid_amount")
      .eq("company_id", company_id)
      .gte("due_date", thirtyDaysAgo.split("T")[0])
      .limit(300);

    const receivables = (financial || []).filter((f) => f.type === "receita");
    const payables = (financial || []).filter((f) => f.type === "despesa");
    const overduePayables = payables.filter(
      (f) => f.status === "pendente" && f.due_date < now.toISOString().split("T")[0]
    );

    contextData.financial = {
      receivables_total: receivables.reduce((s, f) => s + Number(f.amount), 0),
      receivables_pending: receivables.filter((f) => f.status === "pendente").reduce((s, f) => s + Number(f.amount), 0),
      payables_total: payables.reduce((s, f) => s + Number(f.amount), 0),
      payables_overdue: overduePayables.reduce((s, f) => s + Number(f.amount), 0),
      overdue_count: overduePayables.length,
    };

    // Build the prompt
    const systemPrompt = `Você é um analista de negócios expert em varejo brasileiro. 
Analise os dados fornecidos e gere um relatório executivo em português do Brasil.
Use markdown para formatar. Inclua:
1. **Resumo Executivo** — visão geral em 2-3 frases
2. **Indicadores Chave** — métricas importantes com números
3. **Pontos de Atenção** — problemas identificados (⚠️)
4. **Oportunidades** — sugestões acionáveis (💡)
5. **Recomendações** — próximos passos concretos

Seja direto, prático e use linguagem acessível para donos de pequenas/médias empresas.
Valores monetários em R$ (formato brasileiro). Não invente dados.`;

    const userPrompt = `Gere um relatório ${getReportLabel(report_type)} com base nos dados dos últimos 30 dias:

${JSON.stringify(contextData, null, 2)}

Data atual: ${now.toLocaleDateString("pt-BR")}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro ao gerar relatório com IA");
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";

    return new Response(JSON.stringify({ report, data_summary: contextData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-report error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getReportLabel(type: string): string {
  switch (type) {
    case "sales": return "de vendas";
    case "stock": return "de estoque";
    case "financial": return "financeiro";
    default: return "geral (vendas, estoque e financeiro)";
  }
}

function groupBy(items: any[], key: string) {
  const groups: Record<string, { count: number; total: number }> = {};
  for (const item of items) {
    const k = item[key] || "outros";
    if (!groups[k]) groups[k] = { count: 0, total: 0 };
    groups[k].count++;
    groups[k].total += Number(item.total_value);
  }
  return groups;
}

function groupByDate(items: any[]) {
  const groups: Record<string, { count: number; total: number }> = {};
  for (const item of items) {
    const date = item.created_at?.split("T")[0] || "unknown";
    if (!groups[date]) groups[date] = { count: 0, total: 0 };
    groups[date].count++;
    groups[date].total += Number(item.total_value);
  }
  return groups;
}

function calcAvgMargin(products: any[]): number {
  const withCost = products.filter((p) => p.cost_price && p.cost_price > 0 && p.price > 0);
  if (withCost.length === 0) return 0;
  const totalMargin = withCost.reduce(
    (sum, p) => sum + ((p.price - p.cost_price) / p.price) * 100,
    0
  );
  return Math.round(totalMargin / withCost.length);
}
