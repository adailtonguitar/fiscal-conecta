
-- ============================================================
-- 1. Kill Switch: add is_blocked + block_reason to companies
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason text;

-- 2. Telemetry table for usage tracking
CREATE TABLE IF NOT EXISTS public.telemetry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reported_at timestamp with time zone NOT NULL DEFAULT now(),
  period_date date NOT NULL,
  sales_count integer NOT NULL DEFAULT 0,
  sales_total numeric NOT NULL DEFAULT 0,
  nfce_count integer NOT NULL DEFAULT 0,
  nfe_count integer NOT NULL DEFAULT 0,
  products_count integer NOT NULL DEFAULT 0,
  clients_count integer NOT NULL DEFAULT 0,
  active_users integer NOT NULL DEFAULT 0,
  app_version text,
  platform text,
  metadata jsonb
);

-- Unique constraint: one report per company per day
ALTER TABLE public.telemetry
  ADD CONSTRAINT telemetry_company_period_unique UNIQUE (company_id, period_date);

-- Enable RLS
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

-- Members can insert telemetry for their company
CREATE POLICY "Members can insert telemetry"
  ON public.telemetry FOR INSERT
  WITH CHECK (is_company_member(company_id));

-- Only admins/managers can view telemetry
CREATE POLICY "Admins can view telemetry"
  ON public.telemetry FOR SELECT
  USING (is_company_admin_or_manager(company_id));

-- Index for querying by company
CREATE INDEX idx_telemetry_company_period ON public.telemetry (company_id, period_date DESC);
