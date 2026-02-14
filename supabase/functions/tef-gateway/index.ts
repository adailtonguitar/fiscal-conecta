import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  console.log(`[TEF-GW] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

// =================== CIELO API 3.0 ===================
const CIELO_URLS = {
  sandbox: {
    request: "https://apisandbox.cieloecommerce.cielo.com.br",
    query: "https://apiquerysandbox.cieloecommerce.cielo.com.br",
  },
  production: {
    request: "https://api.cieloecommerce.cielo.com.br",
    query: "https://apiquery.cieloecommerce.cielo.com.br",
  },
};

async function cieloCreateTransaction(params: {
  merchantId: string;
  merchantKey: string;
  amount: number;
  installments: number;
  paymentType: string;
  orderId: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${CIELO_URLS[env].request}/1/sales/`;

  const body: Record<string, unknown> = {
    MerchantOrderId: params.orderId,
    Payment: {
      Type: params.paymentType === "debito" ? "DebitCard" : "CreditCard",
      Amount: Math.round(params.amount * 100), // centavos
      Installments: params.installments || 1,
      SoftDescriptor: "PDV",
      Capture: true, // auto-capture
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      MerchantId: params.merchantId,
      MerchantKey: params.merchantKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function cieloCheckTransaction(params: {
  merchantId: string;
  merchantKey: string;
  paymentId: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${CIELO_URLS[env].query}/1/sales/${params.paymentId}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      MerchantId: params.merchantId,
      MerchantKey: params.merchantKey,
      "Content-Type": "application/json",
    },
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function cieloCancelTransaction(params: {
  merchantId: string;
  merchantKey: string;
  paymentId: string;
  amount: number;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${CIELO_URLS[env].request}/1/sales/${params.paymentId}/void?amount=${Math.round(params.amount * 100)}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      MerchantId: params.merchantId,
      MerchantKey: params.merchantKey,
      "Content-Type": "application/json",
    },
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

// =================== REDE (e.Rede) ===================
const REDE_URLS = {
  sandbox: "https://api.userede.com.br/desenvolvedores/v1",
  production: "https://api.userede.com.br/erede/v1",
};

async function redeCreateTransaction(params: {
  pv: string; // affiliation number
  token: string; // integration key
  amount: number;
  installments: number;
  orderId: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${REDE_URLS[env]}/transactions`;
  const auth = btoa(`${params.pv}:${params.token}`);

  const body = {
    capture: true,
    reference: params.orderId,
    amount: Math.round(params.amount * 100),
    installments: params.installments || 1,
    softDescriptor: "PDV",
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function redeCheckTransaction(params: {
  pv: string;
  token: string;
  tid: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${REDE_URLS[env]}/transactions/${params.tid}`;
  const auth = btoa(`${params.pv}:${params.token}`);

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function redeCancelTransaction(params: {
  pv: string;
  token: string;
  tid: string;
  amount: number;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${REDE_URLS[env]}/transactions/${params.tid}/refunds`;
  const auth = btoa(`${params.pv}:${params.token}`);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: Math.round(params.amount * 100) }),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

// =================== PAGSEGURO (PagBank) ===================
const PAGSEGURO_URLS = {
  sandbox: "https://sandbox.api.pagseguro.com",
  production: "https://api.pagseguro.com",
};

async function pagseguroCreateTransaction(params: {
  token: string;
  amount: number;
  installments: number;
  orderId: string;
  description: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${PAGSEGURO_URLS[env]}/orders`;

  const body = {
    reference_id: params.orderId,
    items: [
      {
        reference_id: params.orderId,
        name: params.description || "Venda PDV",
        quantity: 1,
        unit_amount: Math.round(params.amount * 100),
      },
    ],
    charges: [
      {
        reference_id: params.orderId,
        description: params.description || "Venda PDV",
        amount: {
          value: Math.round(params.amount * 100),
          currency: "BRL",
        },
        payment_method: {
          type: "CREDIT_CARD",
          installments: params.installments || 1,
        },
      },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function pagseguroCheckTransaction(params: {
  token: string;
  orderId: string;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${PAGSEGURO_URLS[env]}/orders/${params.orderId}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function pagseguroCancelTransaction(params: {
  token: string;
  chargeId: string;
  amount: number;
  environment: string;
}) {
  const env = params.environment === "production" ? "production" : "sandbox";
  const url = `${PAGSEGURO_URLS[env]}/charges/${params.chargeId}/cancel`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: { value: Math.round(params.amount * 100) },
    }),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

// =================== STONE (via Pagar.me API) ===================
const STONE_URLS = {
  sandbox: "https://api.pagar.me/core/v5",
  production: "https://api.pagar.me/core/v5",
};

async function stoneCreateTransaction(params: {
  apiKey: string;
  amount: number;
  installments: number;
  orderId: string;
  paymentType: string;
  environment: string;
}) {
  const url = `${STONE_URLS[params.environment === "production" ? "production" : "sandbox"]}/orders`;
  const auth = btoa(`${params.apiKey}:`);

  const body = {
    code: params.orderId,
    items: [
      {
        amount: Math.round(params.amount * 100),
        description: "Venda PDV",
        quantity: 1,
      },
    ],
    payments: [
      {
        payment_method: params.paymentType === "debito" ? "debit_card" : "credit_card",
        credit_card: params.paymentType !== "debito" ? { installments: params.installments || 1 } : undefined,
        amount: Math.round(params.amount * 100),
      },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function stoneCheckTransaction(params: {
  apiKey: string;
  orderId: string;
  environment: string;
}) {
  const url = `${STONE_URLS[params.environment === "production" ? "production" : "sandbox"]}/orders/${params.orderId}`;
  const auth = btoa(`${params.apiKey}:`);

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

async function stoneCancelTransaction(params: {
  apiKey: string;
  orderId: string;
  chargeId: string;
  amount: number;
  environment: string;
}) {
  const url = `${STONE_URLS[params.environment === "production" ? "production" : "sandbox"]}/charges/${params.chargeId}`;
  const auth = btoa(`${params.apiKey}:`);

  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: Math.round(params.amount * 100) }),
  });

  return { data: await resp.json(), ok: resp.ok, status: resp.status };
}

// =================== MAIN HANDLER ===================
Deno.serve(async (req) => {
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
    const { provider, action } = body;

    if (!provider || !action) {
      return new Response(
        JSON.stringify({ error: "provider and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log(`${provider}/${action}`, { amount: body.amount });

    let result: { data: unknown; ok: boolean; status: number };

    // ---- CIELO ----
    if (provider === "cielo") {
      const { merchantId, merchantKey, environment = "sandbox" } = body;
      if (!merchantId || !merchantKey) {
        return new Response(
          JSON.stringify({ error: "merchantId e merchantKey são obrigatórios para Cielo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "create") {
        result = await cieloCreateTransaction({
          merchantId,
          merchantKey,
          amount: body.amount,
          installments: body.installments || 1,
          paymentType: body.paymentType || "credito",
          orderId: body.orderId || `PDV-${Date.now()}`,
          environment,
        });
      } else if (action === "check") {
        result = await cieloCheckTransaction({
          merchantId,
          merchantKey,
          paymentId: body.transactionId,
          environment,
        });
      } else if (action === "cancel") {
        result = await cieloCancelTransaction({
          merchantId,
          merchantKey,
          paymentId: body.transactionId,
          amount: body.amount,
          environment,
        });
      } else {
        return new Response(
          JSON.stringify({ error: `Ação não suportada para Cielo: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ---- REDE ----
    else if (provider === "rede") {
      const { pv, integrationKey, environment = "sandbox" } = body;
      if (!pv || !integrationKey) {
        return new Response(
          JSON.stringify({ error: "pv (afiliação) e integrationKey são obrigatórios para Rede" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "create") {
        result = await redeCreateTransaction({
          pv,
          token: integrationKey,
          amount: body.amount,
          installments: body.installments || 1,
          orderId: body.orderId || `PDV-${Date.now()}`,
          environment,
        });
      } else if (action === "check") {
        result = await redeCheckTransaction({
          pv,
          token: integrationKey,
          tid: body.transactionId,
          environment,
        });
      } else if (action === "cancel") {
        result = await redeCancelTransaction({
          pv,
          token: integrationKey,
          tid: body.transactionId,
          amount: body.amount,
          environment,
        });
      } else {
        return new Response(
          JSON.stringify({ error: `Ação não suportada para Rede: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ---- PAGSEGURO ----
    else if (provider === "pagseguro") {
      const { accessToken, environment = "sandbox" } = body;
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "accessToken é obrigatório para PagSeguro" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "create") {
        result = await pagseguroCreateTransaction({
          token: accessToken,
          amount: body.amount,
          installments: body.installments || 1,
          orderId: body.orderId || `PDV-${Date.now()}`,
          description: body.description || "Venda PDV",
          environment,
        });
      } else if (action === "check") {
        result = await pagseguroCheckTransaction({
          token: accessToken,
          orderId: body.transactionId,
          environment,
        });
      } else if (action === "cancel") {
        result = await pagseguroCancelTransaction({
          token: accessToken,
          chargeId: body.transactionId,
          amount: body.amount,
          environment,
        });
      } else {
        return new Response(
          JSON.stringify({ error: `Ação não suportada para PagSeguro: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // ---- STONE (via Pagar.me) ----
    else if (provider === "stone") {
      const { apiKey, environment = "sandbox" } = body;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "apiKey é obrigatória para Stone" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "create") {
        result = await stoneCreateTransaction({
          apiKey,
          amount: body.amount,
          installments: body.installments || 1,
          orderId: body.orderId || `PDV-${Date.now()}`,
          paymentType: body.paymentType || "credito",
          environment,
        });
      } else if (action === "check") {
        result = await stoneCheckTransaction({
          apiKey,
          orderId: body.transactionId,
          environment,
        });
      } else if (action === "cancel") {
        result = await stoneCancelTransaction({
          apiKey,
          orderId: body.transactionId,
          chargeId: body.chargeId,
          amount: body.amount,
          environment,
        });
      } else {
        return new Response(
          JSON.stringify({ error: `Ação não suportada para Stone: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Provedor não suportado: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log(`${provider}/${action} response`, { ok: result!.ok, status: result!.status });

    return new Response(
      JSON.stringify({ success: result!.ok, data: result!.data }),
      {
        status: result!.ok ? 200 : result!.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
