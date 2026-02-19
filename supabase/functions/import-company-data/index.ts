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
      return new Response(
        JSON.stringify({ error: "Sem permissão. Apenas admin/gerente." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = companyUser.company_id;

    // Parse the backup JSON from body
    const body = await req.json();
    const backup = body.backup;

    if (!backup || !backup.data || !backup.version) {
      return new Response(
        JSON.stringify({ error: "Arquivo de backup inválido. Verifique o formato JSON." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tables we support importing (order matters for dependencies)
    const importableTables = [
      "products",
      "clients",
      "suppliers",
      "employees",
      "financial_entries",
      "stock_movements",
      "fiscal_documents",
      "daily_closings",
      "cash_sessions",
      "cash_movements",
    ];

    const results: Record<string, { imported: number; skipped: number; errors: number }> = {};

    for (const table of importableTables) {
      const records = backup.data[table];
      if (!records || !Array.isArray(records) || records.length === 0) {
        continue;
      }

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const record of records) {
        // Override company_id to current company
        const row = { ...record, company_id: companyId };

        // Remove fields that might cause conflicts
        delete row.synced_at;

        // Upsert by id — if record exists, skip (don't overwrite)
        const { error } = await serviceClient
          .from(table)
          .upsert(row, { onConflict: "id", ignoreDuplicates: true });

        if (error) {
          console.error(`[${table}] Error importing record ${record.id}:`, error.message);
          errors++;
        } else {
          // Check if it was actually inserted or skipped
          imported++;
        }
      }

      results[table] = { imported, skipped, errors };
      console.log(`[${table}] Imported: ${imported}, Errors: ${errors}`);
    }

    // Calculate totals
    const totalImported = Object.values(results).reduce((sum, r) => sum + r.imported, 0);
    const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors, 0);

    return new Response(
      JSON.stringify({
        success: true,
        total_imported: totalImported,
        total_errors: totalErrors,
        details: results,
        source: {
          exported_at: backup.exported_at,
          exported_by: backup.exported_by,
          version: backup.version,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", String(err));
    return new Response(
      JSON.stringify({ error: "Erro interno na importação", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
