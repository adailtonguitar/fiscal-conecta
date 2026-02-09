
-- Resellers table (each reseller is a business entity that sells the platform)
CREATE TABLE public.resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  -- White-label branding
  brand_name TEXT NOT NULL DEFAULT 'PDV Fiscal',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1a9e7a',
  secondary_color TEXT DEFAULT '#0f766e',
  custom_domain TEXT,
  -- Business
  markup_percentage NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;

-- Plans that resellers can offer
CREATE TABLE public.reseller_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Limits
  max_users INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 100,
  max_monthly_sales INTEGER,
  -- Pricing
  base_price NUMERIC NOT NULL DEFAULT 0,
  reseller_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_plans ENABLE ROW LEVEL SECURITY;

-- Licenses: links a company to a reseller via a plan
CREATE TABLE public.reseller_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.reseller_plans(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada', 'trial')),
  trial_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_licenses ENABLE ROW LEVEL SECURITY;

-- Commission tracking
CREATE TABLE public.reseller_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.reseller_licenses(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount NUMERIC NOT NULL DEFAULT 0,
  markup_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_commissions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is reseller owner
CREATE OR REPLACE FUNCTION public.is_reseller_owner(_reseller_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resellers
    WHERE id = _reseller_id AND owner_user_id = auth.uid()
  )
$$;

-- RLS Policies for resellers
CREATE POLICY "Owners can view their reseller" ON public.resellers
  FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Authenticated can create reseller" ON public.resellers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());

CREATE POLICY "Owners can update their reseller" ON public.resellers
  FOR UPDATE USING (owner_user_id = auth.uid());

-- RLS Policies for reseller_plans
CREATE POLICY "Reseller owners can view plans" ON public.reseller_plans
  FOR SELECT USING (is_reseller_owner(reseller_id));

CREATE POLICY "Reseller owners can create plans" ON public.reseller_plans
  FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));

CREATE POLICY "Reseller owners can update plans" ON public.reseller_plans
  FOR UPDATE USING (is_reseller_owner(reseller_id));

CREATE POLICY "Reseller owners can delete plans" ON public.reseller_plans
  FOR DELETE USING (is_reseller_owner(reseller_id));

-- RLS Policies for reseller_licenses
CREATE POLICY "Reseller owners can view licenses" ON public.reseller_licenses
  FOR SELECT USING (is_reseller_owner(reseller_id));

CREATE POLICY "Reseller owners can create licenses" ON public.reseller_licenses
  FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));

CREATE POLICY "Reseller owners can update licenses" ON public.reseller_licenses
  FOR UPDATE USING (is_reseller_owner(reseller_id));

-- RLS Policies for reseller_commissions
CREATE POLICY "Reseller owners can view commissions" ON public.reseller_commissions
  FOR SELECT USING (is_reseller_owner(reseller_id));

-- Triggers for updated_at
CREATE TRIGGER update_resellers_updated_at BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reseller_plans_updated_at BEFORE UPDATE ON public.reseller_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reseller_licenses_updated_at BEFORE UPDATE ON public.reseller_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
