import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      company_id,
      period_date,
      sales_count = 0,
      sales_total = 0,
      nfce_count = 0,
      nfe_count = 0,
      products_count = 0,
      clients_count = 0,
      active_users = 0,
      app_version,
      platform,
      metadata,
    } = body;

    if (!company_id || !period_date) {
      return new Response(JSON.stringify({ error: "company_id and period_date required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user belongs to company
    const { data: membership } = await supabase
      .from("company_users")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("company_id", company_id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert telemetry
    const { error: upsertError } = await supabase
      .from("telemetry")
      .upsert(
        {
          company_id,
          period_date,
          sales_count,
          sales_total,
          nfce_count,
          nfe_count,
          products_count,
          clients_count,
          active_users,
          app_version,
          platform,
          metadata,
          reported_at: new Date().toISOString(),
        },
        { onConflict: "company_id,period_date" }
      );

    if (upsertError) {
      console.error("[TELEMETRY] Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[TELEMETRY] ${company_id} → ${period_date}: ${sales_count} vendas, ${nfce_count} NFC-e, ${nfe_count} NF-e`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[TELEMETRY] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
