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

    switch (req.method) {
      case "POST": {
        const body = await req.json();
        const { product_id, type, quantity, unit_cost, reason, reference } = body;

        // Get current stock
        const { data: product, error: pErr } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", product_id)
          .eq("company_id", companyId)
          .single();

        if (pErr) throw new Error(`Product not found: ${pErr.message}`);

        const previous = Number(product.stock_quantity);
        let newStock: number;

        switch (type) {
          case "entrada":
          case "devolucao":
            newStock = previous + quantity;
            break;
          case "saida":
          case "venda":
            newStock = previous - quantity;
            break;
          case "ajuste":
            newStock = quantity;
            break;
          default:
            newStock = previous;
        }

        const { data, error } = await supabase
          .from("stock_movements")
          .insert({
            company_id: companyId,
            product_id,
            type,
            quantity: type === "ajuste" ? Math.abs(quantity - previous) : quantity,
            previous_stock: previous,
            new_stock: newStock,
            unit_cost,
            reason,
            reference,
            performed_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET": {
        const productId = url.searchParams.get("product_id");
        const limit = Number(url.searchParams.get("limit") || "200");

        let query = supabase
          .from("stock_movements")
          .select("*, products(name, sku)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (productId) query = query.eq("product_id", productId);

        const { data, error } = await query;
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
