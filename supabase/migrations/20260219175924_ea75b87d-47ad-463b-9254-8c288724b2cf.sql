
-- Recipes: reusable production templates
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  description TEXT,
  output_product_id UUID REFERENCES public.products(id),
  output_quantity NUMERIC NOT NULL DEFAULT 1,
  output_unit TEXT NOT NULL DEFAULT 'kg',
  category TEXT DEFAULT 'producao',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recipe ingredients (many inputs -> 1 output)
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'kg',
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production orders: each execution of a recipe
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  recipe_id UUID REFERENCES public.recipes(id),
  recipe_name TEXT NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pendente',
  total_cost NUMERIC DEFAULT 0,
  output_quantity NUMERIC NOT NULL DEFAULT 1,
  output_unit TEXT NOT NULL DEFAULT 'kg',
  output_product_id UUID REFERENCES public.products(id),
  notes TEXT,
  produced_by UUID NOT NULL,
  produced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production order items: snapshot of ingredients used
CREATE TABLE public.production_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity_required NUMERIC NOT NULL,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Members can view recipes" ON public.recipes FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create recipes" ON public.recipes FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update recipes" ON public.recipes FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete recipes" ON public.recipes FOR DELETE USING (is_company_admin_or_manager(company_id));

-- Recipe ingredients policies
CREATE POLICY "Members can view recipe ingredients" ON public.recipe_ingredients FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create recipe ingredients" ON public.recipe_ingredients FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update recipe ingredients" ON public.recipe_ingredients FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete recipe ingredients" ON public.recipe_ingredients FOR DELETE USING (is_company_admin_or_manager(company_id));

-- Production orders policies
CREATE POLICY "Members can view production orders" ON public.production_orders FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create production orders" ON public.production_orders FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update production orders" ON public.production_orders FOR UPDATE USING (is_company_member(company_id));

-- Production order items policies
CREATE POLICY "Members can view production items" ON public.production_order_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create production items" ON public.production_order_items FOR INSERT WITH CHECK (is_company_member(company_id));

-- Triggers for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON public.production_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
