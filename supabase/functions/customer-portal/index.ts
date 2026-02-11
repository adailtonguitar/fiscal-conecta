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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Search for user's active/pending preapproval to get the ID
    const searchUrl = new URL("https://api.mercadopago.com/preapproval/search");
    searchUrl.searchParams.set("payer_email", user.email);
    searchUrl.searchParams.set("sort", "date_created");
    searchUrl.searchParams.set("criteria", "desc");
    searchUrl.searchParams.set("limit", "1");

    const response = await fetch(searchUrl.toString(), {
      headers: { "Authorization": `Bearer ${mpToken}` },
    });

    const result = await response.json();
    const results = result.results || [];

    if (results.length === 0) {
      throw new Error("Nenhuma assinatura encontrada para este usuário");
    }

    // Mercado Pago doesn't have a customer portal like Stripe.
    // Redirect to the subscription management page on Mercado Pago
    const subscriptionId = results[0].id;
    const url = `https://www.mercadopago.com.br/subscriptions/details/${subscriptionId}`;

    return new Response(JSON.stringify({ url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
