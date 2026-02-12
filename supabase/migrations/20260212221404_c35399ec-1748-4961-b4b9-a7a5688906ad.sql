
-- Add commission_rate to employees
ALTER TABLE public.employees ADD COLUMN commission_rate numeric DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.employees.commission_rate IS 'Percentual de comissão sobre vendas (ex: 5 = 5%)';
