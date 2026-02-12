
-- Add PIX key fields to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS pix_key_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_city text DEFAULT NULL;

-- pix_key_type: 'cpf', 'cnpj', 'email', 'phone', 'random'
