import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLANS: Record<string, { reason: string; amount: number }> = {
  essencial: { reason: "Plano Essencial", amount: 150 },
  profissional: { reason: "Plano Profissional", amount: 200 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const { planKey } = await req.json();
    const plan = PLANS[planKey];
    if (!plan) throw new Error("Plano inválido");

    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create a preapproval (subscription) via Mercado Pago API
    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpToken}`,
      },
      body: JSON.stringify({
        reason: plan.reason,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.amount,
          currency_id: "BRL",
        },
        payer_email: user.email,
        back_url: `${origin}/dashboard?checkout=success`,
        external_reference: `${user.id}|${planKey}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CREATE-CHECKOUT] MP error:", JSON.stringify(result));
      throw new Error(result.message || "Erro ao criar assinatura no Mercado Pago");
    }

    console.log("[CREATE-CHECKOUT] Preapproval created:", result.id);

    return new Response(JSON.stringify({ url: result.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
