
-- Payment method enum
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'debito', 'credito', 'pix', 'voucher', 'outros');

-- TEF transaction status
CREATE TYPE public.tef_status AS ENUM ('iniciado', 'aguardando_pinpad', 'processando', 'aprovado', 'negado', 'cancelado', 'timeout');

-- Cash register session status
CREATE TYPE public.cash_session_status AS ENUM ('aberto', 'fechado');

-- Cash movement type
CREATE TYPE public.cash_movement_type AS ENUM ('abertura', 'sangria', 'suprimento', 'venda', 'fechamento');

-- Cash register sessions (abertura/fechamento de caixa)
CREATE TABLE public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  terminal_id TEXT NOT NULL DEFAULT '01',
  status cash_session_status NOT NULL DEFAULT 'aberto',
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2),
  -- Totals by payment method (filled on close)
  total_dinheiro NUMERIC(12,2) DEFAULT 0,
  total_debito NUMERIC(12,2) DEFAULT 0,
  total_credito NUMERIC(12,2) DEFAULT 0,
  total_pix NUMERIC(12,2) DEFAULT 0,
  total_voucher NUMERIC(12,2) DEFAULT 0,
  total_outros NUMERIC(12,2) DEFAULT 0,
  total_sangria NUMERIC(12,2) DEFAULT 0,
  total_suprimento NUMERIC(12,2) DEFAULT 0,
  total_vendas NUMERIC(12,2) DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  -- Counted values (operator input on close)
  counted_dinheiro NUMERIC(12,2),
  counted_debito NUMERIC(12,2),
  counted_credito NUMERIC(12,2),
  counted_pix NUMERIC(12,2),
  difference NUMERIC(12,2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view cash sessions" ON public.cash_sessions FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create cash sessions" ON public.cash_sessions FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update cash sessions" ON public.cash_sessions FOR UPDATE USING (public.is_company_member(company_id));

-- Cash movements (sangria, suprimento, etc)
CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type cash_movement_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method payment_method,
  description TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  sale_id UUID REFERENCES public.fiscal_documents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view cash movements" ON public.cash_movements FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create cash movements" ON public.cash_movements FOR INSERT WITH CHECK (public.is_company_member(company_id));

-- TEF transactions (simulated or real)
CREATE TABLE public.tef_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.cash_sessions(id),
  sale_id UUID REFERENCES public.fiscal_documents(id),
  payment_method payment_method NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  installments INTEGER DEFAULT 1,
  status tef_status NOT NULL DEFAULT 'iniciado',
  -- TEF response data
  nsu TEXT,
  authorization_code TEXT,
  card_brand TEXT,
  card_last_digits TEXT,
  acquirer TEXT,
  transaction_date TIMESTAMPTZ,
  receipt_merchant TEXT,
  receipt_customer TEXT,
  error_message TEXT,
  -- PIX specific
  pix_txid TEXT,
  pix_qrcode TEXT,
  pix_url TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tef_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tef transactions" ON public.tef_transactions FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create tef transactions" ON public.tef_transactions FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Members can update tef transactions" ON public.tef_transactions FOR UPDATE USING (public.is_company_member(company_id));

-- Indexes
CREATE INDEX idx_cash_sessions_company ON public.cash_sessions(company_id);
CREATE INDEX idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX idx_cash_movements_session ON public.cash_movements(session_id);
CREATE INDEX idx_tef_transactions_company ON public.tef_transactions(company_id);
CREATE INDEX idx_tef_transactions_session ON public.tef_transactions(session_id);
CREATE INDEX idx_tef_transactions_status ON public.tef_transactions(status);

-- Triggers
CREATE TRIGGER update_tef_transactions_updated_at BEFORE UPDATE ON public.tef_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
