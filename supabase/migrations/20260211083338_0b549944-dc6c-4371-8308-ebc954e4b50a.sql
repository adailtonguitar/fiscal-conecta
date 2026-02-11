
-- Add fiscal_category_id to products table
ALTER TABLE public.products ADD COLUMN fiscal_category_id uuid REFERENCES public.fiscal_categories(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_products_fiscal_category ON public.products(fiscal_category_id);
