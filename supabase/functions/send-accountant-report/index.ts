import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildReportHtml(params: {
  companyName: string;
  cnpj: string;
  period: string;
  salesSummary: { total: number; count: number; byMethod: Record<string, number> };
  fiscalSummary: { authorized: number; canceled: number; rejected: number; pending: number };
  financialSummary: { totalPagar: number; totalReceber: number; pagoNoPeriodo: number; recebidoNoPeriodo: number };
  topProducts: Array<{ name: string; qty: number; total: number }>;
}): string {
  const { companyName, cnpj, period, salesSummary, fiscalSummary, financialSummary, topProducts } = params;

  const methodRows = Object.entries(salesSummary.byMethod)
    .map(([m, v]) => `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;">${m}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:right;">${formatCurrency(v)}</td></tr>`)
    .join("");

  const productRows = topProducts
    .map((p, i) => `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;">${i + 1}. ${p.name}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:center;">${p.qty}</td><td style="padding:6px 12px;border:1px solid #e5e7eb;text-align:right;">${formatCurrency(p.total)}</td></tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;padding:32px 16px;background:#f9fafb;">
  <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#1a1a2e;font-size:20px;margin:0;">Relatório Fiscal Mensal</h1>
      <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">${companyName} — CNPJ: ${cnpj}</p>
      <p style="color:#6b7280;font-size:13px;margin:2px 0 0;">Período: ${period}</p>
    </div>

    <h2 style="color:#1a1a2e;font-size:16px;margin:24px 0 8px;border-bottom:2px solid #6366f1;padding-bottom:4px;">📊 Resumo de Vendas</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:6px 12px;color:#6b7280;">Total de vendas</td><td style="padding:6px 12px;text-align:right;font-weight:600;">${salesSummary.count}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Valor total</td><td style="padding:6px 12px;text-align:right;font-weight:600;">${formatCurrency(salesSummary.total)}</td></tr>
    </table>
    ${methodRows ? `
    <h3 style="color:#374151;font-size:14px;margin:16px 0 6px;">Por forma de pagamento</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">${methodRows}</table>` : ""}

    <h2 style="color:#1a1a2e;font-size:16px;margin:24px 0 8px;border-bottom:2px solid #6366f1;padding-bottom:4px;">📄 Documentos Fiscais</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:6px 12px;color:#6b7280;">Autorizados</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#16a34a;">${fiscalSummary.authorized}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Cancelados</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#dc2626;">${fiscalSummary.canceled}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Rejeitados</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#ea580c;">${fiscalSummary.rejected}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Pendentes</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#ca8a04;">${fiscalSummary.pending}</td></tr>
    </table>

    <h2 style="color:#1a1a2e;font-size:16px;margin:24px 0 8px;border-bottom:2px solid #6366f1;padding-bottom:4px;">💰 Resumo Financeiro</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:6px 12px;color:#6b7280;">Contas a pagar (período)</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#dc2626;">${formatCurrency(financialSummary.totalPagar)}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Contas a receber (período)</td><td style="padding:6px 12px;text-align:right;font-weight:600;color:#16a34a;">${formatCurrency(financialSummary.totalReceber)}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Pago no período</td><td style="padding:6px 12px;text-align:right;font-weight:600;">${formatCurrency(financialSummary.pagoNoPeriodo)}</td></tr>
      <tr><td style="padding:6px 12px;color:#6b7280;">Recebido no período</td><td style="padding:6px 12px;text-align:right;font-weight:600;">${formatCurrency(financialSummary.recebidoNoPeriodo)}</td></tr>
    </table>

    ${productRows ? `
    <h2 style="color:#1a1a2e;font-size:16px;margin:24px 0 8px;border-bottom:2px solid #6366f1;padding-bottom:4px;">🏆 Top 10 Produtos</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead><tr style="background:#f3f4f6;">
        <th style="padding:6px 12px;text-align:left;border:1px solid #e5e7eb;">Produto</th>
        <th style="padding:6px 12px;text-align:center;border:1px solid #e5e7eb;">Qtd</th>
        <th style="padding:6px 12px;text-align:right;border:1px solid #e5e7eb;">Total</th>
      </tr></thead>
      <tbody>${productRows}</tbody>
    </table>` : ""}

    <p style="color:#9ca3af;font-size:11px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;">
      Relatório gerado automaticamente pelo AnthoSystem em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
    </p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company (admin/gerente only)
    const { data: companyUser } = await serviceClient
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["admin", "gerente"])
      .limit(1)
      .single();

    if (!companyUser) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyUser.company_id;

    // Get company info including accountant email
    const { data: company } = await serviceClient
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!company) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const accountantEmail = body.email || (company as any).accountant_email;

    if (!accountantEmail) {
      return new Response(JSON.stringify({ error: "E-mail do contador não configurado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine period (default: last month)
    const now = new Date();
    const year = body.year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const month = body.month || (now.getMonth() === 0 ? 12 : now.getMonth()); // 1-12
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10); // last day of month
    const periodLabel = `${String(month).padStart(2, "0")}/${year}`;

    // === Sales summary (from fiscal_documents) ===
    const { data: fiscalDocs } = await serviceClient
      .from("fiscal_documents")
      .select("status, total_value, payment_method, items_json")
      .eq("company_id", companyId)
      .gte("created_at", startDate)
      .lte("created_at", endDate + "T23:59:59");

    const authorized = (fiscalDocs || []).filter(d => d.status === "autorizada");
    const salesTotal = authorized.reduce((s, d) => s + (d.total_value || 0), 0);
    const byMethod: Record<string, number> = {};
    for (const d of authorized) {
      const m = d.payment_method || "outros";
      byMethod[m] = (byMethod[m] || 0) + (d.total_value || 0);
    }

    // Top products from items_json
    const productMap: Record<string, { name: string; qty: number; total: number }> = {};
    for (const d of authorized) {
      const items = Array.isArray(d.items_json) ? d.items_json : [];
      for (const item of items) {
        const id = (item as any).product_id || (item as any).name;
        if (!id) continue;
        if (!productMap[id]) productMap[id] = { name: (item as any).name || id, qty: 0, total: 0 };
        productMap[id].qty += Number((item as any).quantity) || 0;
        productMap[id].total += Number((item as any).total) || Number((item as any).unit_price || 0) * Number((item as any).quantity || 0);
      }
    }
    const topProducts = Object.values(productMap).sort((a, b) => b.total - a.total).slice(0, 10);

    const fiscalSummary = {
      authorized: (fiscalDocs || []).filter(d => d.status === "autorizada").length,
      canceled: (fiscalDocs || []).filter(d => d.status === "cancelada").length,
      rejected: (fiscalDocs || []).filter(d => d.status === "rejeitada").length,
      pending: (fiscalDocs || []).filter(d => d.status === "pendente").length,
    };

    // === Financial summary ===
    const { data: financials } = await serviceClient
      .from("financial_entries")
      .select("type, status, amount, paid_amount, due_date, paid_date")
      .eq("company_id", companyId)
      .gte("due_date", startDate)
      .lte("due_date", endDate);

    let totalPagar = 0, totalReceber = 0, pagoNoPeriodo = 0, recebidoNoPeriodo = 0;
    for (const f of (financials || [])) {
      if (f.type === "pagar") {
        totalPagar += Number(f.amount) || 0;
        if (f.status === "pago") pagoNoPeriodo += Number(f.paid_amount || f.amount) || 0;
      } else {
        totalReceber += Number(f.amount) || 0;
        if (f.status === "pago") recebidoNoPeriodo += Number(f.paid_amount || f.amount) || 0;
      }
    }

    // Build HTML
    const html = buildReportHtml({
      companyName: company.name,
      cnpj: company.cnpj,
      period: periodLabel,
      salesSummary: { total: salesTotal, count: authorized.length, byMethod },
      fiscalSummary,
      financialSummary: { totalPagar, totalReceber, pagoNoPeriodo, recebidoNoPeriodo },
      topProducts,
    });

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço de e-mail não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountantName = (company as any).accountant_name || "Contador(a)";
    const subject = `Relatório Fiscal ${periodLabel} — ${company.name}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "AnthoSystem <noreply@resend.dev>",
        to: [accountantEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend error:", emailData);
      return new Response(JSON.stringify({ error: "Falha ao enviar e-mail", details: emailData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Accountant report sent: ${accountantEmail}, period=${periodLabel}, email_id=${emailData.id}`);

    return new Response(JSON.stringify({
      success: true,
      email_id: emailData.id,
      sent_to: accountantEmail,
      period: periodLabel,
      summary: { sales: authorized.length, fiscal: fiscalSummary, financial: { totalPagar, totalReceber } },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Accountant report error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
