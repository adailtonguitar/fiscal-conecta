-- Add cost_center column to financial_entries
ALTER TABLE public.financial_entries
ADD COLUMN cost_center text DEFAULT NULL;

-- Create index for filtering by cost_center
CREATE INDEX idx_financial_entries_cost_center ON public.financial_entries (company_id, cost_center);
