
-- Promotions table for the promotion engine
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  description text,
  
  -- Type: 'percentual', 'leve_x_pague_y', 'preco_fixo'
  promo_type text NOT NULL DEFAULT 'percentual',
  
  -- For percentual: discount percentage (e.g. 10 = 10%)
  discount_percent numeric DEFAULT 0,
  
  -- For preco_fixo: the fixed promotional price
  fixed_price numeric DEFAULT 0,
  
  -- For leve_x_pague_y: buy X, pay Y
  buy_quantity integer DEFAULT 0,
  pay_quantity integer DEFAULT 0,
  
  -- Scope: 'product' or 'category'
  scope text NOT NULL DEFAULT 'product',
  
  -- If scope = 'product', link to specific product(s) via promotion_items
  -- If scope = 'category', store category name here
  category_name text,
  
  -- Minimum quantity to trigger (for percentual/preco_fixo)
  min_quantity integer DEFAULT 1,
  
  -- Schedule
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  
  -- Days of week (0=Sun, 1=Mon, ..., 6=Sat). NULL = every day
  active_days integer[],
  
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Promotion items: links promotions to specific products
CREATE TABLE public.promotion_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_promotions_company ON public.promotions(company_id);
CREATE INDEX idx_promotions_active ON public.promotions(company_id, is_active, starts_at, ends_at);
CREATE INDEX idx_promotion_items_promotion ON public.promotion_items(promotion_id);
CREATE INDEX idx_promotion_items_product ON public.promotion_items(product_id);

-- RLS for promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view promotions"
  ON public.promotions FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Admins can create promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- RLS for promotion_items
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view promotion items"
  ON public.promotion_items FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Admins can create promotion items"
  ON public.promotion_items FOR INSERT
  WITH CHECK (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete promotion items"
  ON public.promotion_items FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
