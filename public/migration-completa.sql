-- ============================================================
-- MIGRAÇÃO COMPLETA - Projeto Supabase Externo
-- Target: laeawegsgqmdzrpjeyqi
-- Idempotente - seguro para executar em banco vazio
-- Gerado em: 2026-02-22
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. TIPOS ENUM
-- ============================================================
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('super_admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.company_role AS ENUM ('admin', 'gerente', 'caixa', 'estoquista', 'vendedor', 'fiscal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.cash_movement_type AS ENUM ('venda', 'sangria', 'suprimento', 'abertura', 'fechamento'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.cash_session_status AS ENUM ('aberto', 'fechado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'debito', 'credito', 'pix', 'voucher', 'outros', 'prazo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.financial_type AS ENUM ('pagar', 'receber'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.financial_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado', 'parcial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.financial_category AS ENUM ('vendas','servicos','aluguel','salarios','impostos','fornecedores','manutencao','marketing','transporte','utilidades','outros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fiscal_doc_type AS ENUM ('nfce', 'nfe', 'sat', 'cfe'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.fiscal_doc_status AS ENUM ('pendente', 'autorizada', 'rejeitada', 'cancelada', 'inutilizada', 'contingencia'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.sefaz_environment AS ENUM ('homologacao', 'producao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '', email text, avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, trade_name text, cnpj text NOT NULL, ie text, im text,
  email text, phone text, logo_url text, slogan text, whatsapp_support text,
  tax_regime text DEFAULT 'simples_nacional', modo_seguro_fiscal boolean NOT NULL DEFAULT true,
  is_blocked boolean NOT NULL DEFAULT false, block_reason text,
  address_street text, address_number text, address_complement text,
  address_neighborhood text, address_city text, address_state text DEFAULT 'SP',
  address_zip text, address_ibge_code text,
  pix_key text, pix_key_type text, pix_city text,
  accountant_name text, accountant_email text, accountant_phone text,
  accountant_crc text, accountant_auto_send boolean DEFAULT false, accountant_send_day integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, role company_role NOT NULL DEFAULT 'caixa',
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, sku text NOT NULL, barcode text,
  price numeric NOT NULL DEFAULT 0, cost_price numeric DEFAULT 0,
  stock_quantity numeric NOT NULL DEFAULT 0, min_stock numeric DEFAULT 0,
  unit text NOT NULL DEFAULT 'UN', category text,
  ncm text, cfop text DEFAULT '5102', csosn text DEFAULT '102',
  cst_icms text DEFAULT '00', cst_pis text DEFAULT '01', cst_cofins text DEFAULT '01',
  aliq_icms numeric DEFAULT 0, aliq_pis numeric DEFAULT 1.65, aliq_cofins numeric DEFAULT 7.60,
  origem integer DEFAULT 0, cest text, gtin_tributavel text,
  fiscal_category_id uuid, is_active boolean NOT NULL DEFAULT true, image_url text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

CREATE TABLE IF NOT EXISTS public.product_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lot_number text NOT NULL, quantity numeric NOT NULL DEFAULT 0,
  manufacture_date date, expiry_date date, cost_price numeric DEFAULT 0,
  supplier text, notes text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, cpf_cnpj text, ie text, email text, phone text, phone2 text,
  tipo_pessoa text NOT NULL DEFAULT 'pf', trade_name text,
  address_street text, address_number text, address_complement text,
  address_neighborhood text, address_city text, address_state text DEFAULT 'SP',
  address_zip text, address_ibge_code text,
  credit_limit numeric DEFAULT 0, credit_balance numeric DEFAULT 0,
  loyalty_points integer NOT NULL DEFAULT 0, notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, trade_name text, cnpj text, ie text, email text, phone text,
  contact_name text, address_street text, address_number text, address_complement text,
  address_neighborhood text, address_city text, address_state text DEFAULT 'SP',
  address_zip text, notes text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid, name text NOT NULL, cpf text, rg text, role text, department text,
  email text, phone text, address_street text, address_number text,
  address_city text, address_state text DEFAULT 'SP', address_zip text,
  admission_date date, salary numeric DEFAULT 0, commission_rate numeric DEFAULT 0,
  notes text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, trade_name text, cnpj text, ie text, email text, phone text,
  address_street text, address_city text, address_state text DEFAULT 'SP', address_zip text,
  antt_code text, vehicle_plate text, notes text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '', regime text NOT NULL DEFAULT 'simples_nacional',
  operation_type text NOT NULL DEFAULT 'interna', product_type text NOT NULL DEFAULT 'normal',
  ncm text, cest text, cfop text NOT NULL DEFAULT '5102', csosn text, cst_icms text,
  icms_rate numeric NOT NULL DEFAULT 0, icms_st_rate numeric, mva numeric,
  pis_rate numeric NOT NULL DEFAULT 1.65, cofins_rate numeric NOT NULL DEFAULT 7.60, ipi_rate numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL, environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  serie integer NOT NULL DEFAULT 1, next_number integer NOT NULL DEFAULT 1,
  certificate_path text, certificate_password_hash text, certificate_type text NOT NULL DEFAULT 'A1',
  certificate_expires_at timestamptz, csc_id text, csc_token text,
  sat_serial_number text, sat_activation_code text, a3_subject_name text, a3_thumbprint text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL, number integer, serie integer,
  status fiscal_doc_status NOT NULL DEFAULT 'pendente',
  environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  access_key text, protocol_number text, protocol_date timestamptz, rejection_reason text,
  total_value numeric NOT NULL DEFAULT 0, payment_method text, items_json jsonb,
  customer_cpf_cnpj text, customer_name text,
  is_contingency boolean NOT NULL DEFAULT false, contingency_type text, contingency_reason text,
  xml_sent text, xml_response text, issued_by uuid,
  cancel_reason text, cancel_protocol text, canceled_at timestamptz, canceled_by uuid,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_id uuid REFERENCES public.fiscal_documents(id),
  doc_type fiscal_doc_type, action text NOT NULL, user_id uuid, ip_address text, details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contingencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL, reason text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
  documents_count integer NOT NULL DEFAULT 0, auto_detected boolean NOT NULL DEFAULT false,
  resolved_by uuid, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.icms_st_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  fiscal_category_id uuid REFERENCES public.fiscal_categories(id),
  ncm text, cest text, uf_origin text NOT NULL DEFAULT 'SP', uf_destination text NOT NULL,
  mva_original numeric NOT NULL DEFAULT 0, mva_adjusted numeric,
  icms_internal_rate numeric NOT NULL DEFAULT 18, icms_interstate_rate numeric NOT NULL DEFAULT 12,
  description text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL, quantity numeric NOT NULL, previous_stock numeric NOT NULL,
  new_stock numeric NOT NULL, unit_cost numeric, reason text, reference text,
  performed_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  terminal_id text NOT NULL DEFAULT '01', status cash_session_status NOT NULL DEFAULT 'aberto',
  opening_balance numeric NOT NULL DEFAULT 0, closing_balance numeric,
  opened_by uuid NOT NULL, opened_at timestamptz NOT NULL DEFAULT now(),
  closed_by uuid, closed_at timestamptz,
  sales_count integer DEFAULT 0,
  total_dinheiro numeric DEFAULT 0, total_debito numeric DEFAULT 0,
  total_credito numeric DEFAULT 0, total_pix numeric DEFAULT 0,
  total_voucher numeric DEFAULT 0, total_outros numeric DEFAULT 0,
  total_vendas numeric DEFAULT 0, total_sangria numeric DEFAULT 0, total_suprimento numeric DEFAULT 0,
  counted_dinheiro numeric, counted_debito numeric, counted_credito numeric, counted_pix numeric,
  difference numeric, notes text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  type cash_movement_type NOT NULL, amount numeric NOT NULL,
  payment_method payment_method, sale_id uuid REFERENCES public.fiscal_documents(id),
  performed_by uuid NOT NULL, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type financial_type NOT NULL, category financial_category NOT NULL DEFAULT 'outros',
  status financial_status NOT NULL DEFAULT 'pendente',
  description text NOT NULL, amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric DEFAULT 0, due_date date NOT NULL, paid_date date,
  payment_method text, counterpart text, cost_center text, reference text,
  recurrence text, notes text, created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  closing_date date NOT NULL, closed_by uuid NOT NULL,
  total_sales numeric DEFAULT 0, total_dinheiro numeric DEFAULT 0,
  total_debito numeric DEFAULT 0, total_credito numeric DEFAULT 0,
  total_pix numeric DEFAULT 0, total_outros numeric DEFAULT 0,
  total_receivables numeric DEFAULT 0, total_payables numeric DEFAULT 0,
  cash_balance numeric DEFAULT 0, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  financial_entry_id uuid REFERENCES public.financial_entries(id),
  description text NOT NULL, amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'credit', transaction_date date NOT NULL,
  bank_name text, account_number text, reconciled boolean NOT NULL DEFAULT false,
  notes text, imported_by uuid NOT NULL, imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.card_administrators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, cnpj text,
  debit_rate numeric NOT NULL DEFAULT 0, credit_rate numeric NOT NULL DEFAULT 0,
  credit_installment_rate numeric NOT NULL DEFAULT 0,
  debit_settlement_days integer NOT NULL DEFAULT 1, credit_settlement_days integer NOT NULL DEFAULT 30,
  antecipation_rate numeric DEFAULT 0, contact_email text, contact_phone text,
  notes text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, user_name text, action text NOT NULL,
  module text NOT NULL, details text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL, file_path text NOT NULL, file_size bigint,
  tables_included text[] NOT NULL, records_count jsonb, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Inventário', status text NOT NULL DEFAULT 'aberto',
  performed_by uuid NOT NULL, started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz, notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory_counts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  system_quantity numeric NOT NULL DEFAULT 0, counted_quantity numeric,
  difference numeric, counted_at timestamptz, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true, points_per_real numeric NOT NULL DEFAULT 1,
  redemption_value numeric NOT NULL DEFAULT 0.01, min_redemption_points integer NOT NULL DEFAULT 100,
  welcome_bonus integer NOT NULL DEFAULT 0, birthday_multiplier numeric NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.fiscal_documents(id),
  type text NOT NULL, points integer NOT NULL, balance_after integer NOT NULL DEFAULT 0,
  description text, created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role company_role NOT NULL, module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false, can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false, can_delete boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.discount_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role company_role NOT NULL, max_discount_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pix_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount numeric NOT NULL, description text, status text NOT NULL DEFAULT 'pending',
  external_reference text NOT NULL, qr_code text, qr_code_base64 text, ticket_url text,
  mp_payment_id text, paid_at timestamptz, created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, plan_key text NOT NULL DEFAULT 'gratuito',
  status text NOT NULL DEFAULT 'active', started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, mp_subscription_id text, trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, subscription_id uuid REFERENCES public.subscriptions(id),
  plan_key text NOT NULL, amount numeric NOT NULL, status text NOT NULL DEFAULT 'pending',
  payment_method text, mp_payment_id text, mp_preference_id text, paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'sped', status text NOT NULL DEFAULT 'processing',
  params jsonb, result jsonb, error text, created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id),
  order_number text, status text NOT NULL DEFAULT 'rascunho', items_json jsonb,
  total_value numeric NOT NULL DEFAULT 0, notes text, expected_delivery date,
  created_by uuid NOT NULL, approved_by uuid, approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, type text NOT NULL DEFAULT 'desconto_percentual',
  value numeric NOT NULL DEFAULT 0, min_quantity integer DEFAULT 1, min_value numeric DEFAULT 0,
  product_ids uuid[], category text, payment_methods text[],
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true, created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id),
  quote_number text, status text NOT NULL DEFAULT 'rascunho', items_json jsonb,
  total_value numeric NOT NULL DEFAULT 0, valid_until date, notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tef_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'mercadopago',
  api_key text, api_secret text, merchant_id text,
  terminal_id text DEFAULT '01', environment text NOT NULL DEFAULT 'sandbox',
  auto_confirm boolean NOT NULL DEFAULT true, max_installments integer NOT NULL DEFAULT 12,
  accepted_brands text[] DEFAULT ARRAY['visa','mastercard','elo'],
  is_active boolean NOT NULL DEFAULT true, hardware_model text, connection_type text DEFAULT 'api',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL, company_name text NOT NULL, cnpj text,
  logo_url text, primary_color text DEFAULT '#6366f1', custom_domain text,
  whatsapp text, email text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  license_key text NOT NULL UNIQUE, plan_key text NOT NULL DEFAULT 'basico',
  status text NOT NULL DEFAULT 'available', assigned_at timestamptz, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reseller_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  name text NOT NULL, plan_key text NOT NULL, price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON public.clients(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_company ON public.fiscal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_status ON public.fiscal_documents(status);
CREATE INDEX IF NOT EXISTS idx_stock_mov_company ON public.stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_company ON public.cash_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_mov_session ON public.cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_financial_company ON public.financial_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_type ON public.financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_status ON public.financial_entries(status);
CREATE INDEX IF NOT EXISTS idx_action_logs_company ON public.action_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_categories_company ON public.fiscal_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_configs_company ON public.fiscal_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_company ON public.fiscal_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_inventory ON public.inventory_count_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_client ON public.loyalty_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_company ON public.bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_carriers_company ON public.carriers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON public.suppliers(company_id);

-- ============================================================
-- 5. FUNÇÕES
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = auth.uid() AND company_id = _company_id AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin_or_manager(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = auth.uid() AND company_id = _company_id AND role IN ('admin','gerente') AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT company_id FROM public.company_users WHERE user_id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.auto_assign_company_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.company_users (user_id, company_id, role) VALUES (auth.uid(), NEW.id, 'admin');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.products SET stock_quantity = NEW.new_stock, updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_product_label_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.price IS DISTINCT FROM NEW.price OR OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.product_labels (product_id, company_id, status)
    VALUES (NEW.id, NEW.company_id, 'pendente')
    ON CONFLICT (product_id) DO UPDATE SET status = 'pendente', updated_at = now();
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.seed_default_fiscal_categories()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(NEW.tax_regime, 'simples_nacional') = 'simples_nacional' THEN
    INSERT INTO public.fiscal_categories (company_id, name, regime, operation_type, product_type, cfop, csosn, icms_rate, pis_rate, cofins_rate) VALUES
      (NEW.id, 'SN - Normal Interna', 'simples_nacional', 'interna', 'normal', '5102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - Normal Interestadual', 'simples_nacional', 'interestadual', 'normal', '6102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interna', 'simples_nacional', 'interna', 'st', '5405', '500', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interestadual', 'simples_nacional', 'interestadual', 'st', '6404', '500', 0, 1.65, 7.60);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.is_reseller_owner(_reseller_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.resellers WHERE id = _reseller_id AND owner_user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.encrypt_tef_secrets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE encryption_key text;
BEGIN
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := encode(digest(gen_random_uuid()::text || NEW.company_id::text, 'sha256'), 'hex');
  END IF;
  IF NEW.api_key IS NOT NULL AND NEW.api_key != '' AND NOT starts_with(COALESCE(NEW.api_key,''),E'\\xc3') THEN
    NEW.api_key := encode(pgp_sym_encrypt(NEW.api_key, encryption_key), 'base64');
  END IF;
  IF NEW.api_secret IS NOT NULL AND NEW.api_secret != '' AND NOT starts_with(COALESCE(NEW.api_secret,''),E'\\xc3') THEN
    NEW.api_secret := encode(pgp_sym_encrypt(NEW.api_secret, encryption_key), 'base64');
  END IF;
  IF NEW.merchant_id IS NOT NULL AND NEW.merchant_id != '' AND NOT starts_with(COALESCE(NEW.merchant_id,''),E'\\xc3') THEN
    NEW.merchant_id := encode(pgp_sym_encrypt(NEW.merchant_id, encryption_key), 'base64');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.get_decrypted_tef_config(p_company_id uuid)
RETURNS TABLE(id uuid, company_id uuid, provider text, api_key text, api_secret text, merchant_id text, terminal_id text, environment text, auto_confirm boolean, max_installments integer, accepted_brands text[], is_active boolean, hardware_model text, connection_type text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE encryption_key text;
BEGIN
  IF NOT is_company_member(p_company_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  RETURN QUERY
  SELECT t.id, t.company_id, t.provider,
    CASE WHEN t.api_key IS NOT NULL AND t.api_key != '' THEN COALESCE(pgp_sym_decrypt(decode(t.api_key,'base64'),encryption_key)::text, t.api_key) ELSE t.api_key END,
    CASE WHEN t.api_secret IS NOT NULL AND t.api_secret != '' THEN COALESCE(pgp_sym_decrypt(decode(t.api_secret,'base64'),encryption_key)::text, t.api_secret) ELSE t.api_secret END,
    CASE WHEN t.merchant_id IS NOT NULL AND t.merchant_id != '' THEN COALESCE(pgp_sym_decrypt(decode(t.merchant_id,'base64'),encryption_key)::text, t.merchant_id) ELSE t.merchant_id END,
    t.terminal_id, t.environment, t.auto_confirm, t.max_installments, t.accepted_brands, t.is_active, t.hardware_model, t.connection_type
  FROM public.tef_configs t WHERE t.company_id = p_company_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_daily_profit_report(p_company_id uuid, p_date date)
RETURNS TABLE(total_revenue numeric, total_cost numeric, total_sales bigint, profit numeric, margin numeric, by_payment jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT fd.total_value, fd.items_json, fd.payment_method
    FROM public.fiscal_documents fd
    WHERE fd.company_id = p_company_id AND fd.doc_type = 'nfce' AND fd.status != 'cancelada'::fiscal_doc_status AND DATE(fd.created_at) = p_date
  ),
  revenue_agg AS (SELECT COALESCE(SUM(fs.total_value),0) AS rev, COUNT(*) AS cnt FROM filtered_sales fs),
  cost_agg AS (
    SELECT COALESCE(SUM(COALESCE((item->>'cost_price')::numeric,0)*COALESCE((item->>'quantity')::numeric,1)),0) AS cst
    FROM filtered_sales fs, LATERAL jsonb_array_elements(COALESCE(fs.items_json,'[]'::jsonb)) AS item
  ),
  payment_agg AS (
    SELECT COALESCE(jsonb_object_agg(COALESCE(fs.payment_method,'outros'),total),'{}'::jsonb) AS bp
    FROM (SELECT fs2.payment_method, SUM(fs2.total_value) AS total FROM filtered_sales fs2 GROUP BY fs2.payment_method) fs
  )
  SELECT ra.rev, ca.cst, ra.cnt, ra.rev-ca.cst,
    CASE WHEN ra.rev>0 THEN ((ra.rev-ca.cst)/ra.rev)*100 ELSE 0 END, pa.bp
  FROM revenue_agg ra, cost_agg ca, payment_agg pa;
END; $$;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS auto_assign_admin ON public.companies;
CREATE TRIGGER auto_assign_admin AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.auto_assign_company_admin();

DROP TRIGGER IF EXISTS seed_fiscal_categories ON public.companies;
CREATE TRIGGER seed_fiscal_categories AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.seed_default_fiscal_categories();

DROP TRIGGER IF EXISTS update_stock_on_movement ON public.stock_movements;
CREATE TRIGGER update_stock_on_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

DROP TRIGGER IF EXISTS sync_product_label ON public.products;
CREATE TRIGGER sync_product_label AFTER INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_product_label_sync();

DROP TRIGGER IF EXISTS encrypt_tef_on_save ON public.tef_configs;
CREATE TRIGGER encrypt_tef_on_save BEFORE INSERT OR UPDATE ON public.tef_configs FOR EACH ROW EXECUTE FUNCTION public.encrypt_tef_secrets();

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','products','clients','suppliers','employees','carriers',
    'fiscal_categories','fiscal_configs','fiscal_documents','financial_entries',
    'icms_st_rules','inventory_counts','loyalty_config','card_administrators',
    'pix_payments','subscriptions','processing_jobs','purchase_orders',
    'promotions','quotes','tef_configs','resellers','profiles',
    'product_labels','product_lots','bank_transactions','discount_limits'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I;
      CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t, t, t);
  END LOOP;
END $$;

-- ============================================================
-- 7. RLS
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','user_roles','companies','company_users','products','product_labels','product_lots',
    'clients','suppliers','employees','carriers','fiscal_categories','fiscal_configs',
    'fiscal_documents','fiscal_audit_logs','contingencies','icms_st_rules',
    'stock_movements','cash_sessions','cash_movements','financial_entries',
    'daily_closings','bank_transactions','card_administrators','action_logs',
    'backup_history','inventory_counts','inventory_count_items','loyalty_config',
    'loyalty_transactions','permissions','discount_limits','pix_payments',
    'subscriptions','payment_history','processing_jobs','purchase_orders',
    'promotions','quotes','tef_configs','resellers','reseller_licenses','reseller_plans'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- companies
CREATE POLICY "Members can view their companies" ON public.companies FOR SELECT USING (is_company_member(id));
CREATE POLICY "Authenticated can create company" ON public.companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update company" ON public.companies FOR UPDATE USING (is_company_admin_or_manager(id));
CREATE POLICY "Super admins can view all companies" ON public.companies FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can update all companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'super_admin'));

-- company_users
CREATE POLICY "Admins can view company users" ON public.company_users FOR SELECT USING (is_company_admin_or_manager(company_id) OR user_id = auth.uid());
CREATE POLICY "Admins can add company users" ON public.company_users FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update company users" ON public.company_users FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can remove company users" ON public.company_users FOR DELETE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Super admins can view all company_users" ON public.company_users FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- Bulk: member view + create, admin update + delete
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','clients','suppliers','carriers','fiscal_categories','fiscal_configs',
    'icms_st_rules','inventory_counts','inventory_count_items','loyalty_config',
    'card_administrators','bank_transactions','pix_payments','product_labels',
    'product_lots','tef_configs','purchase_orders','promotions','quotes'
  ] LOOP
    EXECUTE format('CREATE POLICY "Members can view %s" ON public.%I FOR SELECT USING (is_company_member(company_id))', t, t);
    EXECUTE format('CREATE POLICY "Members can create %s" ON public.%I FOR INSERT WITH CHECK (is_company_member(company_id))', t, t);
    EXECUTE format('CREATE POLICY "Admins can update %s" ON public.%I FOR UPDATE USING (is_company_admin_or_manager(company_id))', t, t);
    EXECUTE format('CREATE POLICY "Admins can delete %s" ON public.%I FOR DELETE USING (is_company_admin_or_manager(company_id))', t, t);
  END LOOP;
END $$;

-- employees (admin only)
CREATE POLICY "Admins can view employees" ON public.employees FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can create employees" ON public.employees FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update employees" ON public.employees FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete employees" ON public.employees FOR DELETE USING (is_company_admin_or_manager(company_id));

-- fiscal_documents
CREATE POLICY "Members can view fiscal docs" ON public.fiscal_documents FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create fiscal docs" ON public.fiscal_documents FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update fiscal docs" ON public.fiscal_documents FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- fiscal_audit_logs
CREATE POLICY "Admins can view audit logs" ON public.fiscal_audit_logs FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "System can insert audit logs" ON public.fiscal_audit_logs FOR INSERT WITH CHECK (is_company_member(company_id));

-- contingencies
CREATE POLICY "Members can view contingencies" ON public.contingencies FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create contingencies" ON public.contingencies FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update contingencies" ON public.contingencies FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- stock_movements
CREATE POLICY "Members can view stock_movements" ON public.stock_movements FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (is_company_member(company_id));

-- cash_sessions
CREATE POLICY "Members can view cash_sessions" ON public.cash_sessions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create cash_sessions" ON public.cash_sessions FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update cash_sessions" ON public.cash_sessions FOR UPDATE USING (is_company_member(company_id));

-- cash_movements
CREATE POLICY "Members can view cash_movements" ON public.cash_movements FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create cash_movements" ON public.cash_movements FOR INSERT WITH CHECK (is_company_member(company_id));

-- financial_entries
CREATE POLICY "Admins can view financial entries" ON public.financial_entries FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Members can create financial entries" ON public.financial_entries FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update financial entries" ON public.financial_entries FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete financial entries" ON public.financial_entries FOR DELETE USING (is_company_admin_or_manager(company_id));

-- daily_closings
CREATE POLICY "Members can view daily closings" ON public.daily_closings FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create daily closings" ON public.daily_closings FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update daily closings" ON public.daily_closings FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- action_logs
CREATE POLICY "Admins can view action logs" ON public.action_logs FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Members can insert action logs" ON public.action_logs FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Super admins can view all action_logs" ON public.action_logs FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- backup_history
CREATE POLICY "Admins can view backup history" ON public.backup_history FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can insert backup history" ON public.backup_history FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete backup history" ON public.backup_history FOR DELETE USING (is_company_admin_or_manager(company_id));

-- loyalty_transactions
CREATE POLICY "Members can view loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create loyalty transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (is_company_member(company_id));

-- permissions
CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Only admins can manage permissions via insert" ON public.permissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Only admins can manage permissions via update" ON public.permissions FOR UPDATE USING (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Only admins can manage permissions via delete" ON public.permissions FOR DELETE USING (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- discount_limits
CREATE POLICY "Authenticated can view discount limits" ON public.discount_limits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert discount limits" ON public.discount_limits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Admins can update discount limits" ON public.discount_limits FOR UPDATE USING (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));
CREATE POLICY "Admins can delete discount limits" ON public.discount_limits FOR DELETE USING (EXISTS (SELECT 1 FROM company_users WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true));

-- subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- payment_history
CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage payment history" ON public.payment_history FOR ALL USING (auth.uid() = user_id);

-- processing_jobs
CREATE POLICY "Members can view processing jobs" ON public.processing_jobs FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create processing jobs" ON public.processing_jobs FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update processing jobs" ON public.processing_jobs FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- resellers
CREATE POLICY "Owners can view own reseller" ON public.resellers FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Authenticated can create reseller" ON public.resellers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update own reseller" ON public.resellers FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "Super admins can view all resellers" ON public.resellers FOR SELECT USING (has_role(auth.uid(), 'super_admin'));

-- reseller_licenses
CREATE POLICY "Reseller owners can view licenses" ON public.reseller_licenses FOR SELECT USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can create licenses" ON public.reseller_licenses FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can update licenses" ON public.reseller_licenses FOR UPDATE USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can delete licenses" ON public.reseller_licenses FOR DELETE USING (is_reseller_owner(reseller_id));

-- reseller_plans
CREATE POLICY "Reseller owners can view plans" ON public.reseller_plans FOR SELECT USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can create plans" ON public.reseller_plans FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can update plans" ON public.reseller_plans FOR UPDATE USING (is_reseller_owner(reseller_id));

-- ============================================================
-- 8. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('company-backups','company-backups',false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos','company-logos',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images','product-images',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reseller-logos','reseller-logos',true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read company logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated upload company logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public read reseller logos" ON storage.objects FOR SELECT USING (bucket_id = 'reseller-logos');
CREATE POLICY "Authenticated upload reseller logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated manage backups" ON storage.objects FOR ALL USING (bucket_id = 'company-backups' AND auth.uid() IS NOT NULL);

-- ============================================================
-- 9. GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
