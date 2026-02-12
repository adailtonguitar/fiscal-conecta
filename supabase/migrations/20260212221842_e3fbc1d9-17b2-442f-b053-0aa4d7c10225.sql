
-- Bank transactions imported from statements (OFX/CSV)
CREATE TABLE public.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'credit' CHECK (type IN ('credit', 'debit')),
  bank_name text,
  account_number text,
  reconciled boolean NOT NULL DEFAULT false,
  financial_entry_id uuid REFERENCES public.financial_entries(id) ON DELETE SET NULL,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  imported_by uuid NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view bank transactions"
  ON public.bank_transactions FOR SELECT
  USING (is_company_member(company_id));

CREATE POLICY "Members can create bank transactions"
  ON public.bank_transactions FOR INSERT
  WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can update bank transactions"
  ON public.bank_transactions FOR UPDATE
  USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete bank transactions"
  ON public.bank_transactions FOR DELETE
  USING (is_company_admin_or_manager(company_id));

CREATE INDEX idx_bank_transactions_company_date ON public.bank_transactions (company_id, transaction_date);
CREATE INDEX idx_bank_transactions_reconciled ON public.bank_transactions (company_id, reconciled);
