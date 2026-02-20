import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

export function usePurchaseOrders() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["purchase_orders", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*, suppliers(name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function usePurchaseOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ["purchase_order_items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*, products(name, sku, unit)")
        .eq("order_id", orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useReorderSuggestions() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["reorder_suggestions", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, unit, stock_quantity, reorder_point, reorder_quantity, cost_price")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .gt("reorder_point", 0);
      if (error) throw error;
      return (data || []).filter(p => Number(p.stock_quantity) <= Number(p.reorder_point)) as any[];
    },
    enabled: !!companyId,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  return useMutation({
    mutationFn: async (params: {
      supplier_id?: string;
      notes?: string;
      created_by: string;
      items: { product_id: string; quantity: number; unit_cost: number }[];
    }) => {
      if (!companyId) throw new Error("Empresa não encontrada");
      const totalValue = params.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

      const { data: order, error } = await supabase
        .from("purchase_orders")
        .insert({
          company_id: companyId,
          supplier_id: params.supplier_id || null,
          notes: params.notes,
          created_by: params.created_by,
          total_value: totalValue,
        })
        .select()
        .single();
      if (error) throw error;

      const itemsToInsert = params.items.map(i => ({
        order_id: order.id,
        company_id: companyId,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        total: i.quantity * i.unit_cost,
      }));

      const { error: itemsErr } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);
      if (itemsErr) throw itemsErr;

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Pedido de compra criado!");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: string;
      received_by?: string;
      supplierEmail?: string;
      supplierName?: string;
      totalValue?: number;
      orderId?: string;
    }) => {
      const updates: any = { status: params.status };
      if (params.status === "enviado") updates.sent_at = new Date().toISOString();
      if (params.status === "recebido") {
        updates.received_at = new Date().toISOString();
        updates.received_by = params.received_by;
      }
      const { error } = await supabase
        .from("purchase_orders")
        .update(updates)
        .eq("id", params.id);
      if (error) throw error;

      // Send email to supplier when status is "enviado"
      if (params.status === "enviado" && params.supplierEmail) {
        const shortId = params.id.slice(0, 8);

        // Fetch order items with product names
        const { data: items } = await supabase
          .from("purchase_order_items")
          .select("*, products(name, unit)")
          .eq("order_id", params.id);

        const itemsRows = (items || []).map((item: any) => `
          <tr>
            <td style="padding:8px;border:1px solid #ddd">${item.products?.name || "—"}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity} ${item.products?.unit || "un"}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">R$ ${Number(item.unit_cost || 0).toFixed(2).replace(".", ",")}</td>
            <td style="padding:8px;border:1px solid #ddd;text-align:right">R$ ${Number(item.total || 0).toFixed(2).replace(".", ",")}</td>
          </tr>
        `).join("");

        const html = `
          <div style="font-family:sans-serif;padding:24px;max-width:600px;margin:0 auto">
            <h1 style="font-size:20px;color:#333">Pedido de Compra #${shortId}</h1>
            <p>Olá <strong>${params.supplierName || "Fornecedor"}</strong>,</p>
            <p>Gostaríamos de realizar o seguinte pedido de compra:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f5f5f5">
                  <th style="padding:8px;border:1px solid #ddd;text-align:left">Produto</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:center">Qtd</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:right">Custo Unit.</th>
                  <th style="padding:8px;border:1px solid #ddd;text-align:right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
              <tfoot>
                <tr style="font-weight:bold;background:#f9f9f9">
                  <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">Total:</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right">R$ ${(params.totalValue || 0).toFixed(2).replace(".", ",")}</td>
                </tr>
              </tfoot>
            </table>
            <p>Por favor, confirme o recebimento deste pedido.</p>
            <p style="color:#888;font-size:12px;margin-top:32px">Enviado automaticamente pelo sistema.</p>
          </div>
        `;

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: params.supplierEmail,
              subject: `Pedido de Compra #${shortId}`,
              html,
              type: "purchase_order",
            },
          });
        } catch (emailErr) {
          console.error("Erro ao enviar e-mail:", emailErr);
        }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      if (vars.status === "enviado" && vars.supplierEmail) {
        toast.success("Pedido enviado e e-mail enviado ao fornecedor!");
      } else {
        toast.success("Status atualizado!");
      }
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
