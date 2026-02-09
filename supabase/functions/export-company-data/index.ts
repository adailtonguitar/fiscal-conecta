import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get user
    const authClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for data export
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company
    const { data: companyUser } = await serviceClient
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["admin", "gerente"])
      .limit(1)
      .single();

    if (!companyUser) {
      return new Response(
        JSON.stringify({ error: "Sem permissão. Apenas admin/gerente." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = companyUser.company_id;
    const tables = [
      "products",
      "stock_movements",
      "fiscal_documents",
      "financial_entries",
      "daily_closings",
      "cash_sessions",
      "cash_movements",
    ];

    const exportData: Record<string, unknown[]> = {};
    const recordsCounts: Record<string, number> = {};

    for (const table of tables) {
      const { data, error } = await serviceClient
        .from(table)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(`Error exporting ${table}:`, error.message);
        exportData[table] = [];
        recordsCounts[table] = 0;
      } else {
        exportData[table] = data || [];
        recordsCounts[table] = data?.length || 0;
      }
    }

    // Get company info
    const { data: company } = await serviceClient
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    const backup = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      company,
      data: exportData,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const jsonBytes = new TextEncoder().encode(jsonStr);

    // Save to storage
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, "");
    const filePath = `${companyId}/backup_${datePart}_${timePart}.json`;

    const { error: uploadError } = await serviceClient.storage
      .from("company-backups")
      .upload(filePath, jsonBytes, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Falha ao salvar backup", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record in history
    await serviceClient.from("backup_history").insert({
      company_id: companyId,
      file_path: filePath,
      file_size: jsonBytes.length,
      tables_included: tables,
      records_count: recordsCounts,
      created_by: user.id,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    });

    // Check param to return file directly
    const url = new URL(req.url);
    if (url.searchParams.get("download") === "true") {
      return new Response(jsonBytes, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="backup_${datePart}.json"`,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_path: filePath,
        file_size: jsonBytes.length,
        records: recordsCounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
