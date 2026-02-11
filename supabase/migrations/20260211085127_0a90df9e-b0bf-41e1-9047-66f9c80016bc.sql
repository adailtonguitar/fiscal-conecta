
-- 1. Clean existing data
DELETE FROM public.fiscal_categories;

-- 2. Drop old columns
ALTER TABLE public.fiscal_categories
  DROP COLUMN IF EXISTS code,
  DROP COLUMN IF EXISTS type,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS tax_rate,
  DROP COLUMN IF EXISTS notes;

-- 3. Add new columns
ALTER TABLE public.fiscal_categories
  ADD COLUMN name text NOT NULL DEFAULT '',
  ADD COLUMN regime text NOT NULL DEFAULT 'simples_nacional',
  ADD COLUMN operation_type text NOT NULL DEFAULT 'interna',
  ADD COLUMN product_type text NOT NULL DEFAULT 'normal',
  ADD COLUMN ncm text,
  ADD COLUMN cest text,
  ADD COLUMN cfop text NOT NULL DEFAULT '5102',
  ADD COLUMN csosn text,
  ADD COLUMN cst_icms text,
  ADD COLUMN icms_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN icms_st_rate numeric,
  ADD COLUMN mva numeric,
  ADD COLUMN pis_rate numeric NOT NULL DEFAULT 1.65,
  ADD COLUMN cofins_rate numeric NOT NULL DEFAULT 7.60,
  ADD COLUMN ipi_rate numeric;

-- 4. Create trigger function to auto-create 4 default categories for Simples Nacional companies
CREATE OR REPLACE FUNCTION public.seed_default_fiscal_categories()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only seed for Simples Nacional (default regime)
  IF COALESCE(NEW.tax_regime, 'simples_nacional') = 'simples_nacional' THEN
    INSERT INTO public.fiscal_categories (company_id, name, regime, operation_type, product_type, cfop, csosn, icms_rate, pis_rate, cofins_rate)
    VALUES
      (NEW.id, 'SN - Normal Interna', 'simples_nacional', 'interna', 'normal', '5102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - Normal Interestadual', 'simples_nacional', 'interestadual', 'normal', '6102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interna', 'simples_nacional', 'interna', 'st', '5405', '500', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interestadual', 'simples_nacional', 'interestadual', 'st', '6404', '500', 0, 1.65, 7.60);
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Attach trigger to companies table
CREATE TRIGGER on_company_created_seed_fiscal
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_fiscal_categories();
