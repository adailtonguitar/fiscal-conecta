
-- Add credit limit to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0;

-- Add credit balance (how much the client currently owes)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_balance numeric DEFAULT 0;
