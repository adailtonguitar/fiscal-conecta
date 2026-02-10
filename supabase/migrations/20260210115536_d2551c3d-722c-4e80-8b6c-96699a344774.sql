ALTER TABLE public.reseller_licenses ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.reseller_licenses ALTER COLUMN company_id SET DEFAULT NULL;