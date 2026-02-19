
-- Table for MVA rates by state (UF) per fiscal category
CREATE TABLE public.icms_st_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_category_id UUID REFERENCES public.fiscal_categories(id) ON DELETE CASCADE,
  uf_origin TEXT NOT NULL DEFAULT 'SP',
  uf_destination TEXT NOT NULL,
  mva_original NUMERIC NOT NULL DEFAULT 0,
  mva_adjusted NUMERIC,
  icms_internal_rate NUMERIC NOT NULL DEFAULT 18,
  icms_interstate_rate NUMERIC NOT NULL DEFAULT 12,
  ncm TEXT,
  cest TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icms_st_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view ST rules"
  ON public.icms_st_rules FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create ST rules"
  ON public.icms_st_rules FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update ST rules"
  ON public.icms_st_rules FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete ST rules"
  ON public.icms_st_rules FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- Index for fast lookups
CREATE INDEX idx_icms_st_rules_lookup ON public.icms_st_rules (company_id, uf_origin, uf_destination, ncm);

-- Trigger for updated_at
CREATE TRIGGER update_icms_st_rules_updated_at
  BEFORE UPDATE ON public.icms_st_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
