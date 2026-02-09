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

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get user's company
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

    switch (req.method) {
      case "POST": {
        const body = await req.json();

        if (action === "create") {
          // Create sale
          const { items, total, payment_method, customer_cpf, customer_name } = body;

          // 1. Create fiscal document
          const { data: doc, error: docErr } = await supabase
            .from("fiscal_documents")
            .insert({
              company_id: companyId,
              doc_type: "nfce",
              total_value: total,
              payment_method,
              items_json: items,
              status: "pendente",
              issued_by: user.id,
              customer_cpf_cnpj: customer_cpf,
              customer_name,
            })
            .select("id, number")
            .single();

          if (docErr) throw docErr;

          // 2. Deduct stock for each item
          for (const item of items) {
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();

            if (product) {
              const prev = Number(product.stock_quantity);
              await supabase.from("stock_movements").insert({
                company_id: companyId,
                product_id: item.product_id,
                type: "venda",
                quantity: item.quantity,
                previous_stock: prev,
                new_stock: prev - item.quantity,
                performed_by: user.id,
                reference: doc.id,
              });
            }
          }

          // 3. Audit log
          await supabase.from("action_logs").insert({
            company_id: companyId,
            user_id: user.id,
            action: "venda_criada",
            module: "pdv",
            details: `Venda ${doc.id} - R$ ${total}`,
          });

          return new Response(JSON.stringify({ id: doc.id, number: doc.number }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (action === "sync-batch") {
          // Batch sync offline sales
          const { sales } = body;
          const results = [];

          for (const sale of sales) {
            try {
              const { data: doc, error } = await supabase
                .from("fiscal_documents")
                .insert({
                  company_id: companyId,
                  doc_type: "nfce",
                  total_value: sale.total,
                  payment_method: sale.payment_method,
                  items_json: sale.items,
                  status: "pendente",
                  issued_by: user.id,
                  created_at: sale.created_at,
                })
                .select("id")
                .single();

              results.push({ offline_id: sale.id, synced: !error, doc_id: doc?.id, error: error?.message });
            } catch (err: any) {
              results.push({ offline_id: sale.id, synced: false, error: err.message });
            }
          }

          return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "GET": {
        // List recent sales
        const limit = Number(url.searchParams.get("limit") || "50");
        const { data, error } = await supabase
          .from("fiscal_documents")
          .select("*")
          .eq("company_id", companyId)
          .eq("doc_type", "nfce")
          .order("created_at", { ascending: false })
          .limit(limit);

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
