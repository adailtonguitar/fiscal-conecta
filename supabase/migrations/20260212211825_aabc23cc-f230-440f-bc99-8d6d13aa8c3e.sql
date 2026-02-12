
-- Tabela de limites de desconto por cargo
CREATE TABLE public.discount_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.company_role NOT NULL UNIQUE,
  max_discount_percent numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_limits ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read discount limits
CREATE POLICY "Authenticated can view discount limits"
ON public.discount_limits
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage discount limits
CREATE POLICY "Admins can insert discount limits"
ON public.discount_limits
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

CREATE POLICY "Admins can update discount limits"
ON public.discount_limits
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

CREATE POLICY "Admins can delete discount limits"
ON public.discount_limits
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

-- Seed default values
INSERT INTO public.discount_limits (role, max_discount_percent) VALUES
  ('admin', 100),
  ('gerente', 15),
  ('supervisor', 10),
  ('caixa', 5);

-- Trigger for updated_at
CREATE TRIGGER update_discount_limits_updated_at
BEFORE UPDATE ON public.discount_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
