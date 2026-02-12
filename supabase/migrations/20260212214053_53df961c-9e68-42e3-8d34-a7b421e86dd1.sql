
-- Table to store TEF provider configuration per company
CREATE TABLE public.tef_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  provider TEXT NOT NULL DEFAULT 'simulado',
  -- Provider credentials (encrypted via application layer)
  api_key TEXT,
  api_secret TEXT,
  merchant_id TEXT,
  terminal_id TEXT DEFAULT '01',
  -- Provider-specific settings
  environment TEXT NOT NULL DEFAULT 'sandbox',
  auto_confirm BOOLEAN NOT NULL DEFAULT true,
  max_installments INTEGER NOT NULL DEFAULT 12,
  accepted_brands TEXT[] DEFAULT ARRAY['visa','mastercard','elo','amex','hipercard'],
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- One active config per company
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.tef_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage TEF configs"
ON public.tef_configs FOR ALL
USING (is_company_admin_or_manager(company_id))
WITH CHECK (is_company_admin_or_manager(company_id));

CREATE POLICY "Members can view TEF configs"
ON public.tef_configs FOR SELECT
USING (is_company_member(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_tef_configs_updated_at
BEFORE UPDATE ON public.tef_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
