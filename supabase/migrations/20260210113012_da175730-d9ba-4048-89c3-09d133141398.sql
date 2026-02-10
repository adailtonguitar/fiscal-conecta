
-- Add NFe and NFCe limit columns to reseller_plans
ALTER TABLE public.reseller_plans
  ADD COLUMN max_nfe integer DEFAULT NULL,
  ADD COLUMN max_nfce integer DEFAULT NULL;

-- Rename max_monthly_sales for clarity (already exists, keep as is)
COMMENT ON COLUMN public.reseller_plans.max_monthly_sales IS 'Limite mensal de vendas. NULL = ilimitado.';
COMMENT ON COLUMN public.reseller_plans.max_nfe IS 'Limite mensal de NFe. NULL = ilimitado.';
COMMENT ON COLUMN public.reseller_plans.max_nfce IS 'Limite mensal de NFCe. NULL = ilimitado.';
