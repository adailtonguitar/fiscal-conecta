import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { company_id, date, sales, financial } = body;

    if (!company_id || !date) {
      return new Response(
        JSON.stringify({ error: "company_id and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Upsert daily closing record
    const { error: upsertError } = await supabase
      .from("daily_closings")
      .upsert(
        {
          company_id,
          closing_date: date,
          closed_by: userId,
          total_sales: sales?.total_value ?? 0,
          total_dinheiro: sales?.total_dinheiro ?? 0,
          total_debito: sales?.total_debito ?? 0,
          total_credito: sales?.total_credito ?? 0,
          total_pix: sales?.total_pix ?? 0,
          total_receivables: financial?.receivables ?? 0,
          total_payables: financial?.payables ?? 0,
          cash_balance: (sales?.total_dinheiro ?? 0) - 0, // simplified
          notes: `Sync automático - ${sales?.total_count ?? 0} vendas`,
        },
        { onConflict: "company_id,closing_date" }
      );

    if (upsertError) {
      // If upsert fails due to no unique constraint, try insert
      const { error: insertError } = await supabase
        .from("daily_closings")
        .insert({
          company_id,
          closing_date: date,
          closed_by: userId,
          total_sales: sales?.total_value ?? 0,
          total_dinheiro: sales?.total_dinheiro ?? 0,
          total_debito: sales?.total_debito ?? 0,
          total_credito: sales?.total_credito ?? 0,
          total_pix: sales?.total_pix ?? 0,
          total_receivables: financial?.receivables ?? 0,
          total_payables: financial?.payables ?? 0,
          cash_balance: sales?.total_dinheiro ?? 0,
          notes: `Sync automático - ${sales?.total_count ?? 0} vendas`,
        });

      if (insertError) {
        console.error("Daily summary insert error:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, date }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Daily summary error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
