import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!companyUser) {
      return new Response(JSON.stringify({ error: "No company found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyUser.company_id;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (req.method) {
      case "POST": {
        const body = await req.json();

        if (action === "open") {
          const { data, error } = await supabase
            .from("cash_sessions")
            .insert({
              company_id: companyId,
              opened_by: user.id,
              opening_balance: body.opening_balance || 0,
              terminal_id: body.terminal_id || "01",
              status: "aberto",
            })
            .select()
            .single();

          if (error) throw error;

          await supabase.from("cash_movements").insert({
            company_id: companyId,
            session_id: data.id,
            type: "abertura",
            amount: body.opening_balance || 0,
            performed_by: user.id,
            description: "Abertura de caixa",
          });

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (action === "close") {
          const { session_id, counted_dinheiro, counted_debito, counted_credito, counted_pix, notes } = body;

          const { data: session } = await supabase
            .from("cash_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("company_id", companyId)
            .single();

          if (!session) throw new Error("Session not found");

          const totalCounted = (counted_dinheiro || 0) + (counted_debito || 0) + (counted_credito || 0) + (counted_pix || 0);
          const totalExpected =
            Number(session.opening_balance) +
            Number(session.total_dinheiro || 0) +
            Number(session.total_debito || 0) +
            Number(session.total_credito || 0) +
            Number(session.total_pix || 0) +
            Number(session.total_suprimento || 0) -
            Number(session.total_sangria || 0);

          const { data, error } = await supabase
            .from("cash_sessions")
            .update({
              status: "fechado",
              closed_by: user.id,
              closed_at: new Date().toISOString(),
              closing_balance: totalCounted,
              counted_dinheiro,
              counted_debito,
              counted_credito,
              counted_pix,
              difference: totalCounted - totalExpected,
              notes,
            })
            .eq("id", session_id)
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (action === "movement") {
          const { session_id, type, amount, description } = body;

          const { data, error } = await supabase
            .from("cash_movements")
            .insert({
              company_id: companyId,
              session_id,
              type,
              amount,
              performed_by: user.id,
              description,
            })
            .select()
            .single();

          if (error) throw error;

          // Update session total
          const field = type === "sangria" ? "total_sangria" : "total_suprimento";
          const { data: sess } = await supabase
            .from("cash_sessions")
            .select(field)
            .eq("id", session_id)
            .single();

          if (sess) {
            await supabase
              .from("cash_sessions")
              .update({ [field]: Number((sess as any)[field] || 0) + amount })
              .eq("id", session_id);
          }

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET": {
        if (action === "current") {
          const { data } = await supabase
            .from("cash_sessions")
            .select("*")
            .eq("company_id", companyId)
            .eq("status", "aberto")
            .order("opened_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("cash_sessions")
          .select("*")
          .eq("company_id", companyId)
          .order("opened_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
