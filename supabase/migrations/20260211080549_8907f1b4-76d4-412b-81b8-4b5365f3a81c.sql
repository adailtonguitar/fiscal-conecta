-- Create product_labels table
CREATE TABLE public.product_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'impressa')),
  last_printed_at TIMESTAMP WITH TIME ZONE,
  printed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

-- Enable RLS
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view labels" ON public.product_labels
  FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Members can create labels" ON public.product_labels
  FOR INSERT WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members can update labels" ON public.product_labels
  FOR UPDATE USING (is_company_member(company_id));

CREATE POLICY "Admins can delete labels" ON public.product_labels
  FOR DELETE USING (is_company_admin_or_manager(company_id));

-- Trigger to update updated_at
CREATE TRIGGER update_product_labels_updated_at
  BEFORE UPDATE ON public.product_labels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: auto-create/update label when product price or name changes
CREATE OR REPLACE FUNCTION public.handle_product_label_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.price IS DISTINCT FROM NEW.price OR OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.product_labels (product_id, company_id, status)
    VALUES (NEW.id, NEW.company_id, 'pendente')
    ON CONFLICT (product_id) DO UPDATE SET status = 'pendente', updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_product_labels
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_product_label_sync();