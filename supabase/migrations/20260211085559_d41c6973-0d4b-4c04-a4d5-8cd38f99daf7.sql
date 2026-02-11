
-- Add safe mode flag to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS modo_seguro_fiscal boolean NOT NULL DEFAULT true;
