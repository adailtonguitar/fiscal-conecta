
-- Financial account type
CREATE TYPE public.financial_type AS ENUM ('pagar', 'receber');
CREATE TYPE public.financial_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
CREATE TYPE public.financial_category AS ENUM (
  'fornecedor', 'aluguel', 'energia', 'agua', 'internet', 'salario', 'impostos', 'manutencao', 'outros',
  'venda', 'servico', 'comissao', 'reembolso'
);

-- Financial entries (contas a pagar e receber)
CREATE TABLE public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  type public.financial_type NOT NULL,
  status public.financial_status NOT NULL DEFAULT 'pendente',
  category public.financial_category NOT NULL DEFAULT 'outros',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  counterpart TEXT,
  notes TEXT,
  reference TEXT,
  recurrence TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view financial entries" ON public.financial_entries
  FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create financial entries" ON public.financial_entries
  FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update financial entries" ON public.financial_entries
  FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete financial entries" ON public.financial_entries
  FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_financial_entries_updated_at
BEFORE UPDATE ON public.financial_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily closings
CREATE TABLE public.daily_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  closing_date DATE NOT NULL,
  total_sales NUMERIC DEFAULT 0,
  total_receivables NUMERIC DEFAULT 0,
  total_payables NUMERIC DEFAULT 0,
  cash_balance NUMERIC DEFAULT 0,
  total_dinheiro NUMERIC DEFAULT 0,
  total_debito NUMERIC DEFAULT 0,
  total_credito NUMERIC DEFAULT 0,
  total_pix NUMERIC DEFAULT 0,
  total_outros NUMERIC DEFAULT 0,
  notes TEXT,
  closed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, closing_date)
);

ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view daily closings" ON public.daily_closings
  FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create daily closings" ON public.daily_closings
  FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update daily closings" ON public.daily_closings
  FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- Indexes
CREATE INDEX idx_financial_entries_company_due ON public.financial_entries(company_id, due_date);
CREATE INDEX idx_financial_entries_company_type ON public.financial_entries(company_id, type, status);
CREATE INDEX idx_daily_closings_company_date ON public.daily_closings(company_id, closing_date);
