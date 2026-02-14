import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MP_API_BASE = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, companyId, deviceId, amount, description, installments, paymentIntentId, accessToken } = body;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Access token do Mercado Pago não fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mpHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // === ACTION: create_payment_intent ===
    if (action === "create_payment_intent") {
      if (!deviceId || !amount) {
        return new Response(
          JSON.stringify({ error: "deviceId e amount são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload: Record<string, unknown> = {
        amount: Math.round(amount * 100), // MP expects cents
        description: description || "Venda PDV",
        payment: {
          installments: installments || 1,
          type: installments && installments > 1 ? "credit_card" : "credit_card",
        },
        additional_info: {
          external_reference: companyId,
          print_on_terminal: true,
        },
      };

      const resp = await fetch(
        `${MP_API_BASE}/point/integration-api/devices/${deviceId}/payment-intents`,
        { method: "POST", headers: mpHeaders, body: JSON.stringify(payload) }
      );

      const data = await resp.json();

      if (!resp.ok) {
        console.error("[TEF-MP] Erro ao criar payment intent:", JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: data.message || "Erro ao criar intent", details: data }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: check_payment_intent ===
    if (action === "check_payment_intent") {
      if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: "paymentIntentId é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch(
        `${MP_API_BASE}/point/integration-api/payment-intents/${paymentIntentId}`,
        { method: "GET", headers: mpHeaders }
      );

      const data = await resp.json();

      if (!resp.ok) {
        console.error("[TEF-MP] Erro ao consultar intent:", JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: data.message || "Erro ao consultar intent", details: data }),
          { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: cancel_payment_intent ===
    if (action === "cancel_payment_intent") {
      if (!deviceId || !paymentIntentId) {
        return new Response(
          JSON.stringify({ error: "deviceId e paymentIntentId são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resp = await fetch(
        `${MP_API_BASE}/point/integration-api/devices/${deviceId}/payment-intents/${paymentIntentId}`,
        { method: "DELETE", headers: mpHeaders }
      );

      const data = await resp.json();

      return new Response(JSON.stringify({ success: resp.ok, data }), {
        status: resp.ok ? 200 : resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: list_devices ===
    if (action === "list_devices") {
      const resp = await fetch(`${MP_API_BASE}/point/integration-api/devices`, {
        method: "GET",
        headers: mpHeaders,
      });

      const data = await resp.json();

      return new Response(JSON.stringify({ success: resp.ok, data }), {
        status: resp.ok ? 200 : resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Ação desconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[TEF-MP] Erro:", err);
    const msg = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
