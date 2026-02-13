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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active companies
    const { data: companies, error: compError } = await serviceClient
      .from("companies")
      .select("id, name");

    if (compError || !companies) {
      console.error("Failed to fetch companies:", compError?.message);
      return new Response(
        JSON.stringify({ error: "Falha ao buscar empresas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tables = [
      "products",
      "clients",
      "stock_movements",
      "fiscal_documents",
      "financial_entries",
      "daily_closings",
      "cash_sessions",
      "cash_movements",
      "employees",
      "suppliers",
    ];

    const results: Record<string, { success: boolean; records?: number; error?: string }> = {};

    for (const company of companies) {
      try {
        const exportData: Record<string, unknown[]> = {};
        const recordsCounts: Record<string, number> = {};
        let totalRecords = 0;

        for (const table of tables) {
          const { data, error } = await serviceClient
            .from(table)
            .select("*")
            .eq("company_id", company.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error(`[${company.name}] Error exporting ${table}:`, error.message);
            exportData[table] = [];
            recordsCounts[table] = 0;
          } else {
            exportData[table] = data || [];
            recordsCounts[table] = data?.length || 0;
            totalRecords += recordsCounts[table];
          }
        }

        // Get company info
        const { data: companyInfo } = await serviceClient
          .from("companies")
          .select("*")
          .eq("id", company.id)
          .single();

        const backup = {
          version: "1.0",
          type: "auto",
          exported_at: new Date().toISOString(),
          exported_by: "sistema (backup automático)",
          company: companyInfo,
          data: exportData,
        };

        const jsonStr = JSON.stringify(backup, null, 2);
        const jsonBytes = new TextEncoder().encode(jsonStr);

        const now = new Date();
        const datePart = now.toISOString().slice(0, 10);
        const timePart = now.toISOString().slice(11, 19).replace(/:/g, "");
        const filePath = `${company.id}/auto_backup_${datePart}_${timePart}.json`;

        const { error: uploadError } = await serviceClient.storage
          .from("company-backups")
          .upload(filePath, jsonBytes, {
            contentType: "application/json",
            upsert: false,
          });

        if (uploadError) {
          console.error(`[${company.name}] Upload error:`, uploadError.message);
          results[company.id] = { success: false, error: uploadError.message };
          continue;
        }

        // Record in history - use a system user ID placeholder
        await serviceClient.from("backup_history").insert({
          company_id: company.id,
          file_path: filePath,
          file_size: jsonBytes.length,
          tables_included: tables,
          records_count: recordsCounts,
          created_by: "00000000-0000-0000-0000-000000000000",
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Clean old auto-backups (keep last 30)
        const { data: oldBackups } = await serviceClient
          .from("backup_history")
          .select("id, file_path")
          .eq("company_id", company.id)
          .like("file_path", `%auto_backup%`)
          .order("created_at", { ascending: false })
          .range(30, 1000);

        if (oldBackups && oldBackups.length > 0) {
          for (const old of oldBackups) {
            await serviceClient.storage.from("company-backups").remove([old.file_path]);
            await serviceClient.from("backup_history").delete().eq("id", old.id);
          }
          console.log(`[${company.name}] Cleaned ${oldBackups.length} old backups`);
        }

        results[company.id] = { success: true, records: totalRecords };
        console.log(`[${company.name}] Backup completed: ${totalRecords} records`);
      } catch (err) {
        console.error(`[${company.name}] Backup failed:`, String(err));
        results[company.id] = { success: false, error: String(err) };
      }
    }

    return new Response(
      JSON.stringify({ success: true, companies: companies.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-backup fatal error:", String(err));
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
