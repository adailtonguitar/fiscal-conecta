
-- Add client company and seller contact fields to reseller_licenses
ALTER TABLE public.reseller_licenses
  ADD COLUMN client_name text DEFAULT NULL,
  ADD COLUMN client_trade_name text DEFAULT NULL,
  ADD COLUMN client_cnpj text DEFAULT NULL,
  ADD COLUMN client_email text DEFAULT NULL,
  ADD COLUMN client_phone text DEFAULT NULL,
  ADD COLUMN seller_name text DEFAULT NULL,
  ADD COLUMN seller_phone text DEFAULT NULL,
  ADD COLUMN seller_email text DEFAULT NULL;
