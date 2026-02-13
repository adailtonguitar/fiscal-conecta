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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Auth failed", { error: userError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = userData.user.id;
    logStep("User authenticated", { id: userId });

    // Check kill switch — is the user's company blocked?
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (companyUser?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("is_blocked, block_reason")
        .eq("id", companyUser.company_id)
        .single();

      if (company?.is_blocked) {
        logStep("Company blocked", { company_id: companyUser.company_id, reason: company.block_reason });
        return new Response(JSON.stringify({
          subscribed: false,
          blocked: true,
          block_reason: company.block_reason || "Acesso bloqueado pelo administrador do sistema.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check local subscriptions table for active subscription
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("current_period_end", new Date().toISOString())
      .order("current_period_end", { ascending: false })
      .limit(1)
      .single();

    if (subError || !sub) {
      // Check if there's an expired subscription that needs updating
      await supabase
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("user_id", userId)
        .eq("status", "active")
        .lt("current_period_end", new Date().toISOString());

      // Check if user was ever a subscriber (for grace period / inadimplência)
      const { data: lastSub } = await supabase
        .from("subscriptions")
        .select("plan_key, current_period_end, status")
        .eq("user_id", userId)
        .in("status", ["expired", "canceled"])
        .order("current_period_end", { ascending: false })
        .limit(1)
        .single();

      const wasSubscriber = !!lastSub;
      logStep("No active subscription found", { wasSubscriber, lastEnd: lastSub?.current_period_end });

      return new Response(JSON.stringify({
        subscribed: false,
        was_subscriber: wasSubscriber,
        last_subscription_end: lastSub?.current_period_end ?? null,
        plan_key: lastSub?.plan_key ?? null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Active subscription found", {
      id: sub.id,
      plan_key: sub.plan_key,
      period_end: sub.current_period_end,
    });

    return new Response(JSON.stringify({
      subscribed: true,
      plan_key: sub.plan_key,
      subscription_end: sub.current_period_end,
      payment_method: sub.payment_method,
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
