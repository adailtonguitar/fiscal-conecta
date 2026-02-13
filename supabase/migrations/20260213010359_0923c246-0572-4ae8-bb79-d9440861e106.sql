
-- Table for quotes/budgets (orçamentos)
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  quote_number SERIAL,
  client_id UUID REFERENCES public.clients(id),
  client_name TEXT,
  items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_value NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  valid_until DATE,
  created_by UUID NOT NULL,
  converted_sale_id UUID REFERENCES public.fiscal_documents(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view quotes"
ON public.quotes FOR SELECT
USING (is_company_member(company_id));

CREATE POLICY "Members can create quotes"
ON public.quotes FOR INSERT
WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members can update quotes"
ON public.quotes FOR UPDATE
USING (is_company_member(company_id));

CREATE POLICY "Admins can delete quotes"
ON public.quotes FOR DELETE
USING (is_company_admin_or_manager(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
