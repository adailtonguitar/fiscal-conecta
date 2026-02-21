import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RENEWAL-REMINDER] ${step}${d}`);
};

function renewalEmailHtml(userName: string, planName: string, daysLeft: number, renewUrl: string): string {
  const urgency = daysLeft <= 1
    ? "⚠️ Sua assinatura expira hoje!"
    : daysLeft <= 3
    ? `⚠️ Sua assinatura expira em ${daysLeft} dias!`
    : `Sua assinatura expira em ${daysLeft} dias.`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
      <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Olá, ${userName}!</h1>
      <p style="color: #dc2626; font-size: 16px; font-weight: 600; line-height: 1.6;">
        ${urgency}
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        Seu plano <strong>${planName}</strong> no AnthoSystem está próximo do vencimento.
        Renove agora para continuar usando todas as funcionalidades sem interrupção.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${renewUrl}" style="display: inline-block; padding: 14px 40px; background: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
          Renovar Agora
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        Após o vencimento, você terá <strong>3 dias de carência</strong> para renovar.
        Depois disso, o acesso ao sistema será bloqueado até a regularização.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        AnthoSystem — Sistema de Vendas e Gestão Comercial
      </p>
    </div>
  `;
}

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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Find subscriptions expiring in 1, 3, 5, or 7 days
    const now = new Date();
    const reminderDays = [1, 3, 5, 7];
    let totalSent = 0;

    for (const days of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Find active subscriptions ending on that date
      const { data: subs, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, plan_key, current_period_end")
        .eq("status", "active")
        .gte("current_period_end", `${dateStr}T00:00:00Z`)
        .lte("current_period_end", `${dateStr}T23:59:59Z`);

      if (subsError) {
        logStep("Error querying subscriptions", { error: subsError.message, days });
        continue;
      }

      if (!subs || subs.length === 0) {
        logStep(`No subscriptions expiring in ${days} days`);
        continue;
      }

      logStep(`Found ${subs.length} subscriptions expiring in ${days} days`);

      for (const sub of subs) {
        try {
          // Get user email from auth
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(sub.user_id);
          if (userError || !userData?.user?.email) {
            logStep("Could not get user email", { userId: sub.user_id });
            continue;
          }

          const email = userData.user.email;
          const userName = userData.user.user_metadata?.full_name || email.split("@")[0];
          const planName = sub.plan_key === "profissional" ? "Profissional" : "Essencial";
          const renewUrl = "https://cloud-ponto-magico.lovable.app/renovar";

          const subject = days <= 1
            ? "⚠️ Sua assinatura expira hoje — AnthoSystem"
            : `Sua assinatura expira em ${days} dias — AnthoSystem`;

          const html = renewalEmailHtml(userName, planName, days, renewUrl);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "AnthoSystem <noreply@resend.dev>",
              to: [email],
              subject,
              html,
            }),
          });

          if (res.ok) {
            totalSent++;
            logStep("Email sent", { email, days, plan: sub.plan_key });
          } else {
            const errBody = await res.json();
            logStep("Failed to send email", { email, error: errBody });
          }
        } catch (err) {
          logStep("Error processing subscription", { userId: sub.user_id, error: String(err) });
        }
      }
    }

    logStep("Completed", { totalSent });

    return new Response(JSON.stringify({ success: true, emails_sent: totalSent }), {
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
