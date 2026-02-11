import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header - returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      logStep("Auth failed - returning unsubscribed", { error: userError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const user = userData.user;
    logStep("User authenticated", { email: user.email });

    // Search for active preapprovals (subscriptions) by payer email
    const searchUrl = new URL("https://api.mercadopago.com/preapproval/search");
    searchUrl.searchParams.set("payer_email", user.email);
    searchUrl.searchParams.set("status", "authorized");
    searchUrl.searchParams.set("limit", "1");

    const response = await fetch(searchUrl.toString(), {
      headers: { "Authorization": `Bearer ${mpToken}` },
    });

    const result = await response.json();

    if (!response.ok) {
      logStep("MP search error", result);
      throw new Error("Erro ao consultar assinaturas no Mercado Pago");
    }

    const results = result.results || [];
    const hasActiveSub = results.length > 0;
    let planKey: string | null = null;
    let subscriptionEnd: string | null = null;

    if (hasActiveSub) {
      const sub = results[0];
      subscriptionEnd = sub.next_payment_date || null;

      // Extract planKey from external_reference (format: "userId|planKey")
      const extRef = sub.external_reference || "";
      const parts = extRef.split("|");
      if (parts.length >= 2) {
        planKey = parts[1];
      }

      // Fallback: detect plan by amount
      if (!planKey && sub.auto_recurring?.transaction_amount) {
        const amount = sub.auto_recurring.transaction_amount;
        if (amount === 150) planKey = "essencial";
        else if (amount === 200) planKey = "profissional";
      }

      logStep("Active subscription found", { id: sub.id, planKey, subscriptionEnd });
    } else {
      // Also check "pending" status (user approved but first payment not yet processed)
      const pendingUrl = new URL("https://api.mercadopago.com/preapproval/search");
      pendingUrl.searchParams.set("payer_email", user.email);
      pendingUrl.searchParams.set("status", "pending");
      pendingUrl.searchParams.set("limit", "1");

      const pendingRes = await fetch(pendingUrl.toString(), {
        headers: { "Authorization": `Bearer ${mpToken}` },
      });
      const pendingResult = await pendingRes.json();
      const pendingResults = pendingResult.results || [];

      if (pendingResults.length > 0) {
        const sub = pendingResults[0];
        const extRef = sub.external_reference || "";
        const parts = extRef.split("|");
        if (parts.length >= 2) planKey = parts[1];
        if (!planKey && sub.auto_recurring?.transaction_amount) {
          const amount = sub.auto_recurring.transaction_amount;
          if (amount === 150) planKey = "essencial";
          else if (amount === 200) planKey = "profissional";
        }
        logStep("Pending subscription found (treating as active)", { id: sub.id, planKey });
        return new Response(JSON.stringify({
          subscribed: true,
          plan_key: planKey,
          subscription_end: sub.next_payment_date || null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_key: planKey,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
