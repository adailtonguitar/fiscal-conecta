
-- Tabela de lotes de produtos
CREATE TABLE public.product_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  manufacture_date DATE,
  expiry_date DATE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  supplier TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view product lots" ON public.product_lots FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create product lots" ON public.product_lots FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update product lots" ON public.product_lots FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete product lots" ON public.product_lots FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_product_lots_updated_at BEFORE UPDATE ON public.product_lots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de inventários (contagens)
CREATE TABLE public.inventory_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL DEFAULT 'Inventário',
  status TEXT NOT NULL DEFAULT 'aberto',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  performed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view inventory counts" ON public.inventory_counts FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create inventory counts" ON public.inventory_counts FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update inventory counts" ON public.inventory_counts FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete inventory counts" ON public.inventory_counts FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_inventory_counts_updated_at BEFORE UPDATE ON public.inventory_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Itens do inventário
CREATE TABLE public.inventory_count_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  system_quantity NUMERIC NOT NULL DEFAULT 0,
  counted_quantity NUMERIC,
  difference NUMERIC GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - system_quantity) STORED,
  notes TEXT,
  counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view inventory items" ON public.inventory_count_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create inventory items" ON public.inventory_count_items FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update inventory items" ON public.inventory_count_items FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Admins can delete inventory items" ON public.inventory_count_items FOR DELETE USING (is_company_admin_or_manager(company_id));
