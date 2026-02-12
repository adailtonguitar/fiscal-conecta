
-- Loyalty program configuration per company
CREATE TABLE public.loyalty_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  points_per_real numeric NOT NULL DEFAULT 1,
  redemption_value numeric NOT NULL DEFAULT 0.01,
  min_redemption_points integer NOT NULL DEFAULT 100,
  welcome_bonus integer NOT NULL DEFAULT 0,
  birthday_multiplier numeric NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Loyalty transactions (earn/redeem)
CREATE TABLE public.loyalty_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus', 'expire', 'adjust')),
  points integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  description text,
  sale_id uuid REFERENCES public.fiscal_documents(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add loyalty points balance to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- Enable RLS
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS for loyalty_config
CREATE POLICY "Members can view loyalty config"
  ON public.loyalty_config FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Admins can insert loyalty config"
  ON public.loyalty_config FOR INSERT
  WITH CHECK (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can update loyalty config"
  ON public.loyalty_config FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete loyalty config"
  ON public.loyalty_config FOR DELETE
  USING (is_company_admin_or_manager(company_id));

-- RLS for loyalty_transactions
CREATE POLICY "Members can view loyalty transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create loyalty transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (is_company_member(company_id));

-- Triggers for updated_at
CREATE TRIGGER update_loyalty_config_updated_at
  BEFORE UPDATE ON public.loyalty_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_loyalty_transactions_client ON public.loyalty_transactions(client_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_company ON public.loyalty_transactions(company_id, created_at DESC);
