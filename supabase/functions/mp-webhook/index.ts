import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_AMOUNTS: Record<number, string> = {
  150: "essencial",
  200: "profissional",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MP-WEBHOOK] ${step}${d}`);
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
    const body = await req.json();
    logStep("Received notification", { type: body.type, action: body.action });

    // Only process payment notifications
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      logStep("Ignoring non-payment notification");
      return new Response("OK", { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      logStep("No payment ID in notification");
      return new Response("OK", { status: 200 });
    }

    // Fetch payment details from MP
    const mpToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mpToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${mpToken}` },
    });

    if (!paymentRes.ok) {
      logStep("Failed to fetch payment", { status: paymentRes.status });
      return new Response("OK", { status: 200 });
    }

    const payment = await paymentRes.json();
    logStep("Payment details", {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      amount: payment.transaction_amount,
      payment_type: payment.payment_type_id,
    });

    const extRef = payment.external_reference || "";

    // ─── PIX SALE PAYMENT (external_reference starts with "pix_sale|") ───
    if (extRef.startsWith("pix_sale|")) {
      logStep("Processing PIX sale payment", { extRef, status: payment.status });

      const newStatus = payment.status === "approved" ? "approved"
        : payment.status === "rejected" ? "rejected"
        : payment.status === "cancelled" ? "cancelled"
        : payment.status;

      const updateData: Record<string, unknown> = {
        status: newStatus,
        mp_payment_id: String(paymentId),
        updated_at: new Date().toISOString(),
      };

      if (payment.status === "approved") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("pix_payments")
        .update(updateData)
        .eq("external_reference", extRef);

      if (updateError) {
        logStep("Error updating pix_payments", { error: updateError.message });
      } else {
        logStep("pix_payments updated successfully", { status: newStatus });
      }

      return new Response("OK", { status: 200 });
    }

    // ─── SUBSCRIPTION PAYMENT (original flow: "userId|planKey") ───
    const parts = extRef.split("|");
    if (parts.length < 2) {
      logStep("Invalid external_reference, skipping");
      return new Response("OK", { status: 200 });
    }

    const userId = parts[0];
    let planKey = parts[1];

    // Fallback: detect plan by amount
    if (!planKey && payment.transaction_amount) {
      planKey = PLAN_AMOUNTS[payment.transaction_amount] || null;
    }

    if (!planKey) {
      logStep("Could not determine plan, skipping");
      return new Response("OK", { status: 200 });
    }

    const paymentMethod = payment.payment_type_id || "unknown";

    // Record in payment_history
    await supabase.from("payment_history").upsert({
      user_id: userId,
      plan_key: planKey,
      amount: payment.transaction_amount,
      status: payment.status,
      payment_method: paymentMethod,
      mp_payment_id: String(paymentId),
      mp_preference_id: payment.preference_id || null,
      paid_at: payment.status === "approved" ? new Date().toISOString() : null,
    }, { onConflict: "mp_payment_id" });

    if (payment.status === "approved") {
      logStep("Payment approved, activating subscription", { userId, planKey });

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Get user's company_id
      const { data: cuData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .single();

      // Deactivate any existing active subscriptions
      await supabase
        .from("subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");

      // Create new active subscription
      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        company_id: cuData?.company_id || null,
        plan_key: planKey,
        status: "active",
        payment_method: paymentMethod,
        mp_payment_id: String(paymentId),
        mp_preference_id: payment.preference_id || null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      if (subError) {
        logStep("Error creating subscription", { error: subError.message });
      } else {
        logStep("Subscription activated successfully");
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response("OK", { status: 200 }); // Always return 200 to MP
  }
});
