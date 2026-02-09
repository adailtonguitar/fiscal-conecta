
-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  ncm TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'UN',
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view products" ON public.products
  FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Admins can create products" ON public.products
  FOR INSERT WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (is_company_admin_or_manager(company_id));

-- Stock movement type enum
CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste', 'venda', 'devolucao');

-- Stock movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  type public.stock_movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  previous_stock NUMERIC NOT NULL DEFAULT 0,
  new_stock NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC,
  reason TEXT,
  reference TEXT,
  performed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view stock movements" ON public.stock_movements
  FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Members can create stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (is_company_member(company_id));

-- Trigger to update product stock on movement
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = NEW.new_stock, updated_at = now()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();

-- Trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
