
-- Card administrators table (operadoras de cartão)
CREATE TABLE public.card_administrators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  cnpj TEXT,
  debit_rate NUMERIC NOT NULL DEFAULT 0,
  credit_rate NUMERIC NOT NULL DEFAULT 0,
  credit_installment_rate NUMERIC NOT NULL DEFAULT 0,
  debit_settlement_days INTEGER NOT NULL DEFAULT 1,
  credit_settlement_days INTEGER NOT NULL DEFAULT 30,
  antecipation_rate NUMERIC DEFAULT 0,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_card_admin_company ON public.card_administrators(company_id);

-- Enable RLS
ALTER TABLE public.card_administrators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view card administrators"
  ON public.card_administrators FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create card administrators"
  ON public.card_administrators FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update card administrators"
  ON public.card_administrators FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete card administrators"
  ON public.card_administrators FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- Updated_at trigger
CREATE TRIGGER update_card_administrators_updated_at
  BEFORE UPDATE ON public.card_administrators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
