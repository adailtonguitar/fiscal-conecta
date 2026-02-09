
-- Step 1: Add supervisor to enum
ALTER TYPE public.company_role ADD VALUE IF NOT EXISTS 'supervisor' AFTER 'gerente';
