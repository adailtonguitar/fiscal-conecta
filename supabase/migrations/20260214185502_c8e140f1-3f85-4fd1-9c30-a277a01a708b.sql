
-- Add reorder fields to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reorder_point numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_quantity numeric DEFAULT 0;

-- Purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'rascunho', -- rascunho, enviado, recebido, cancelado
  total_value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  received_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase order items
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  received_quantity NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for purchase_orders
CREATE POLICY "Members can view purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete purchase orders"
  ON public.purchase_orders FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- RLS policies for purchase_order_items
CREATE POLICY "Members can view purchase order items"
  ON public.purchase_order_items FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create purchase order items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update purchase order items"
  ON public.purchase_order_items FOR UPDATE
  USING (is_company_member(company_id));

CREATE POLICY "Admins can delete purchase order items"
  ON public.purchase_order_items FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- Trigger for updated_at on purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
