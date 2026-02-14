import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PIX-CREATE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { amount, description, company_id } = await req.json();

    if (!amount || !company_id) {
      return new Response(JSON.stringify({ error: "amount and company_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "MERCADO_PAGO_ACCESS_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a unique external reference for this sale PIX
    const externalRef = `pix_sale|${company_id}|${userId}|${Date.now()}`;
    logStep("Creating PIX payment", { amount, externalRef });

    // Create payment via Mercado Pago API
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalRef,
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: description || "Pagamento PIX - Venda PDV",
        payment_method_id: "pix",
        external_reference: externalRef,
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
        payer: {
          email: "cliente@pdv.com", // placeholder, MP requires this field
        },
      }),
    });

    const mpData = await mpRes.json();
    logStep("MP response", { status: mpRes.status, id: mpData.id, mpStatus: mpData.status });

    if (!mpRes.ok) {
      logStep("MP error", mpData);
      return new Response(
        JSON.stringify({ error: "Failed to create PIX payment", details: mpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || null;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url || null;

    // Save to pix_payments table using service role for insert
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: pixRecord, error: insertError } = await supabaseAdmin
      .from("pix_payments")
      .insert({
        company_id,
        amount: Number(amount),
        description: description || "Pagamento PIX - Venda PDV",
        external_reference: externalRef,
        mp_payment_id: String(mpData.id),
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        status: mpData.status || "pending",
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      logStep("Insert error", insertError);
    }

    return new Response(
      JSON.stringify({
        id: pixRecord?.id,
        mp_payment_id: String(mpData.id),
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        status: mpData.status,
        external_reference: externalRef,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
