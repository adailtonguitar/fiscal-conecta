-- Add certificate_type column to fiscal_configs
ALTER TABLE public.fiscal_configs
ADD COLUMN IF NOT EXISTS certificate_type text NOT NULL DEFAULT 'A1';

-- Add a3_thumbprint to store the selected A3 certificate thumbprint
ALTER TABLE public.fiscal_configs
ADD COLUMN IF NOT EXISTS a3_thumbprint text;

-- Add a3_subject_name to display the A3 cert holder name
ALTER TABLE public.fiscal_configs
ADD COLUMN IF NOT EXISTS a3_subject_name text;