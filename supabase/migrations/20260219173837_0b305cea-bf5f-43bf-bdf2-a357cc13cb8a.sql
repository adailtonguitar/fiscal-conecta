
-- Add accountant fields to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS accountant_name TEXT,
ADD COLUMN IF NOT EXISTS accountant_email TEXT,
ADD COLUMN IF NOT EXISTS accountant_phone TEXT,
ADD COLUMN IF NOT EXISTS accountant_crc TEXT,
ADD COLUMN IF NOT EXISTS accountant_auto_send BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accountant_send_day INTEGER DEFAULT 5;
