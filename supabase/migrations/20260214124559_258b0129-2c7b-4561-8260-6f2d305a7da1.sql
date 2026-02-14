
-- Tabela para rastrear pagamentos PIX dinâmicos via Mercado Pago
CREATE TABLE public.pix_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  amount NUMERIC NOT NULL,
  description TEXT,
  external_reference TEXT NOT NULL,
  mp_payment_id TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pix_payments_company ON public.pix_payments(company_id);
CREATE INDEX idx_pix_payments_external_ref ON public.pix_payments(external_reference);
CREATE INDEX idx_pix_payments_status ON public.pix_payments(status);

-- Enable RLS
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Members can view pix payments"
  ON public.pix_payments FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create pix payments"
  ON public.pix_payments FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Members can update pix payments"
  ON public.pix_payments FOR UPDATE
  USING (is_company_member(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON public.pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
