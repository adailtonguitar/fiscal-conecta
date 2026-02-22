-- ============================================================
-- MIGRAÇÃO COMPLETA: Lovable Cloud → Supabase Externo
-- Projeto: xvopwjwgvriisizysbkf
-- Gerado em: 2026-02-22
-- ============================================================
-- INSTRUÇÕES:
-- 1. Abra o SQL Editor do Supabase destino (laeawegsgqmdzrpjeyqi)
-- 2. Cole e execute este arquivo INTEIRO
-- 3. Siga o checklist de validação no final
-- ============================================================

-- ============================================================
-- PARTE 1: EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
-- pg_cron, pg_net, pg_graphql, pg_stat_statements, supabase_vault
-- já vêm habilitadas no Supabase por padrão

-- ============================================================
-- PARTE 2: ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.company_role AS ENUM ('admin', 'gerente', 'supervisor', 'caixa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fiscal_doc_type AS ENUM ('nfce', 'nfe', 'sat');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fiscal_doc_status AS ENUM ('pendente', 'autorizada', 'cancelada', 'rejeitada', 'contingencia', 'inutilizada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sefaz_environment AS ENUM ('homologacao', 'producao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'debito', 'credito', 'pix', 'voucher', 'outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tef_status AS ENUM ('iniciado', 'aguardando_pinpad', 'processando', 'aprovado', 'negado', 'cancelado', 'timeout');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.cash_session_status AS ENUM ('aberto', 'fechado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.cash_movement_type AS ENUM ('abertura', 'sangria', 'suprimento', 'venda', 'fechamento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM ('entrada', 'saida', 'ajuste', 'venda', 'devolucao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.financial_type AS ENUM ('pagar', 'receber');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.financial_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.financial_category AS ENUM ('fornecedor', 'aluguel', 'energia', 'agua', 'internet', 'salario', 'impostos', 'manutencao', 'outros', 'venda', 'servico', 'comissao', 'reembolso');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- PARTE 3: TABELAS
-- ============================================================

-- profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade_name text,
  cnpj text NOT NULL,
  ie text,
  im text,
  email text,
  phone text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text DEFAULT 'SP',
  address_zip text,
  address_ibge_code text,
  logo_url text,
  slogan text,
  tax_regime text DEFAULT 'simples_nacional',
  modo_seguro_fiscal boolean NOT NULL DEFAULT true,
  is_blocked boolean NOT NULL DEFAULT false,
  block_reason text,
  pix_key text,
  pix_key_type text,
  pix_city text,
  whatsapp_support text,
  accountant_name text,
  accountant_email text,
  accountant_phone text,
  accountant_crc text,
  accountant_auto_send boolean DEFAULT false,
  accountant_send_day integer DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- company_users
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  role company_role NOT NULL DEFAULT 'caixa',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  sku text NOT NULL,
  barcode text,
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  stock_quantity numeric NOT NULL DEFAULT 0,
  min_stock numeric DEFAULT 0,
  unit text NOT NULL DEFAULT 'UN',
  category text,
  image_url text,
  ncm text,
  cfop text DEFAULT '5102',
  csosn text DEFAULT '102',
  cst_icms text DEFAULT '00',
  cst_pis text DEFAULT '01',
  cst_cofins text DEFAULT '01',
  aliq_icms numeric DEFAULT 0,
  aliq_pis numeric DEFAULT 1.65,
  aliq_cofins numeric DEFAULT 7.60,
  origem integer DEFAULT 0,
  cest text,
  gtin_tributavel text,
  fiscal_category_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  trade_name text,
  cpf_cnpj text,
  ie text,
  email text,
  phone text,
  phone2 text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text DEFAULT 'SP',
  address_zip text,
  address_ibge_code text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  credit_limit numeric DEFAULT 0,
  credit_balance numeric DEFAULT 0,
  tipo_pessoa text NOT NULL DEFAULT 'pf',
  loyalty_points integer NOT NULL DEFAULT 0
);

-- suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  trade_name text,
  cnpj text,
  ie text,
  email text,
  phone text,
  address_street text,
  address_number text,
  address_city text,
  address_state text DEFAULT 'SP',
  address_zip text,
  contact_name text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- carriers
CREATE TABLE IF NOT EXISTS public.carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  trade_name text,
  cnpj text,
  ie text,
  email text,
  phone text,
  address_street text,
  address_city text,
  address_state text DEFAULT 'SP',
  address_zip text,
  antt_code text,
  vehicle_plate text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- employees
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid,
  name text NOT NULL,
  cpf text,
  rg text,
  role text,
  department text,
  email text,
  phone text,
  address_street text,
  address_number text,
  address_city text,
  address_state text DEFAULT 'SP',
  address_zip text,
  admission_date date,
  salary numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- fiscal_categories
CREATE TABLE IF NOT EXISTS public.fiscal_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL DEFAULT '',
  regime text NOT NULL DEFAULT 'simples_nacional',
  operation_type text NOT NULL DEFAULT 'interna',
  product_type text NOT NULL DEFAULT 'normal',
  ncm text,
  cest text,
  cfop text NOT NULL DEFAULT '5102',
  csosn text,
  cst_icms text,
  icms_rate numeric NOT NULL DEFAULT 0,
  icms_st_rate numeric,
  mva numeric,
  pis_rate numeric NOT NULL DEFAULT 1.65,
  cofins_rate numeric NOT NULL DEFAULT 7.60,
  ipi_rate numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- fiscal_configs
CREATE TABLE IF NOT EXISTS public.fiscal_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  doc_type fiscal_doc_type NOT NULL,
  environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  serie integer NOT NULL DEFAULT 1,
  next_number integer NOT NULL DEFAULT 1,
  certificate_type text NOT NULL DEFAULT 'A1',
  certificate_path text,
  certificate_password_hash text,
  certificate_expires_at timestamptz,
  csc_id text,
  csc_token text,
  sat_serial_number text,
  sat_activation_code text,
  a3_subject_name text,
  a3_thumbprint text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, doc_type)
);

-- fiscal_documents
CREATE TABLE IF NOT EXISTS public.fiscal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  doc_type fiscal_doc_type NOT NULL,
  number integer,
  serie integer,
  status fiscal_doc_status NOT NULL DEFAULT 'pendente',
  environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  access_key text,
  protocol_number text,
  protocol_date timestamptz,
  total_value numeric NOT NULL DEFAULT 0,
  items_json jsonb,
  payment_method text,
  customer_cpf_cnpj text,
  customer_name text,
  is_contingency boolean NOT NULL DEFAULT false,
  contingency_type text,
  contingency_reason text,
  issued_by uuid,
  canceled_at timestamptz,
  canceled_by uuid,
  cancel_reason text,
  cancel_protocol text,
  rejection_reason text,
  xml_sent text,
  xml_response text,
  synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- fiscal_audit_logs
CREATE TABLE IF NOT EXISTS public.fiscal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  document_id uuid REFERENCES public.fiscal_documents(id),
  doc_type fiscal_doc_type,
  action text NOT NULL,
  details jsonb,
  user_id uuid,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- icms_st_rules
CREATE TABLE IF NOT EXISTS public.icms_st_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  fiscal_category_id uuid REFERENCES public.fiscal_categories(id),
  uf_origin text NOT NULL DEFAULT 'SP',
  uf_destination text NOT NULL,
  ncm text,
  cest text,
  description text,
  mva_original numeric NOT NULL DEFAULT 0,
  mva_adjusted numeric,
  icms_internal_rate numeric NOT NULL DEFAULT 18,
  icms_interstate_rate numeric NOT NULL DEFAULT 12,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- contingencies
CREATE TABLE IF NOT EXISTS public.contingencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  doc_type fiscal_doc_type NOT NULL,
  reason text NOT NULL,
  auto_detected boolean NOT NULL DEFAULT false,
  documents_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- cash_sessions
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  terminal_id text NOT NULL DEFAULT '01',
  status cash_session_status NOT NULL DEFAULT 'aberto',
  opening_balance numeric NOT NULL DEFAULT 0,
  closing_balance numeric,
  opened_by uuid NOT NULL,
  closed_by uuid,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  total_dinheiro numeric DEFAULT 0,
  total_debito numeric DEFAULT 0,
  total_credito numeric DEFAULT 0,
  total_pix numeric DEFAULT 0,
  total_voucher numeric DEFAULT 0,
  total_outros numeric DEFAULT 0,
  total_sangria numeric DEFAULT 0,
  total_suprimento numeric DEFAULT 0,
  total_vendas numeric DEFAULT 0,
  sales_count integer DEFAULT 0,
  counted_dinheiro numeric,
  counted_debito numeric,
  counted_credito numeric,
  counted_pix numeric,
  difference numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- cash_movements
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cash_sessions(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  type cash_movement_type NOT NULL,
  amount numeric NOT NULL,
  payment_method payment_method,
  description text,
  performed_by uuid NOT NULL,
  sale_id uuid REFERENCES public.fiscal_documents(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- stock_movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  type stock_movement_type NOT NULL,
  quantity numeric NOT NULL,
  previous_stock numeric NOT NULL DEFAULT 0,
  new_stock numeric NOT NULL DEFAULT 0,
  unit_cost numeric,
  reason text,
  reference text,
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- financial_entries
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  type financial_type NOT NULL,
  category financial_category NOT NULL DEFAULT 'outros',
  status financial_status NOT NULL DEFAULT 'pendente',
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  payment_method text,
  counterpart text,
  cost_center text,
  reference text,
  recurrence text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- daily_closings
CREATE TABLE IF NOT EXISTS public.daily_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  closing_date date NOT NULL,
  closed_by uuid NOT NULL,
  total_sales numeric DEFAULT 0,
  total_dinheiro numeric DEFAULT 0,
  total_debito numeric DEFAULT 0,
  total_credito numeric DEFAULT 0,
  total_pix numeric DEFAULT 0,
  total_outros numeric DEFAULT 0,
  total_receivables numeric DEFAULT 0,
  total_payables numeric DEFAULT 0,
  cash_balance numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, closing_date)
);

-- action_logs
CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  user_id uuid NOT NULL,
  user_name text,
  action text NOT NULL,
  module text NOT NULL,
  details text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- backup_history
CREATE TABLE IF NOT EXISTS public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  file_path text NOT NULL,
  file_size bigint,
  tables_included text[] NOT NULL,
  records_count jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- bank_transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'credit',
  bank_name text,
  account_number text,
  reconciled boolean NOT NULL DEFAULT false,
  financial_entry_id uuid REFERENCES public.financial_entries(id),
  imported_at timestamptz NOT NULL DEFAULT now(),
  imported_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- card_administrators
CREATE TABLE IF NOT EXISTS public.card_administrators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  cnpj text,
  debit_rate numeric NOT NULL DEFAULT 0,
  credit_rate numeric NOT NULL DEFAULT 0,
  credit_installment_rate numeric NOT NULL DEFAULT 0,
  debit_settlement_days integer NOT NULL DEFAULT 1,
  credit_settlement_days integer NOT NULL DEFAULT 30,
  antecipation_rate numeric DEFAULT 0,
  contact_phone text,
  contact_email text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_key text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  mp_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- payment_history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  plan_key text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mp_payment_id text,
  mp_preference_id text,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role company_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  UNIQUE(role, module)
);

-- discount_limits
CREATE TABLE IF NOT EXISTS public.discount_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role company_role NOT NULL UNIQUE,
  max_discount_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pix_payments
CREATE TABLE IF NOT EXISTS public.pix_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  external_reference text NOT NULL,
  amount numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  qr_code text,
  qr_code_base64 text,
  ticket_url text,
  mp_payment_id text,
  created_by uuid NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  parent_id uuid,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_labels
CREATE TABLE IF NOT EXISTS public.product_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) UNIQUE,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  status text NOT NULL DEFAULT 'pendente',
  last_printed_at timestamptz,
  printed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_lots
CREATE TABLE IF NOT EXISTS public.product_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  lot_number text NOT NULL,
  manufacture_date date,
  expiry_date date,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  supplier text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_counts
CREATE TABLE IF NOT EXISTS public.inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL DEFAULT 'Inventário',
  status text NOT NULL DEFAULT 'aberto',
  performed_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_count_items
CREATE TABLE IF NOT EXISTS public.inventory_count_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  inventory_id uuid NOT NULL REFERENCES public.inventory_counts(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  system_quantity numeric NOT NULL DEFAULT 0,
  counted_quantity numeric,
  difference numeric,
  counted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- loyalty_config
CREATE TABLE IF NOT EXISTS public.loyalty_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  points_per_real numeric NOT NULL DEFAULT 1,
  redemption_value numeric NOT NULL DEFAULT 0.01,
  min_redemption_points integer NOT NULL DEFAULT 100,
  birthday_multiplier numeric NOT NULL DEFAULT 2,
  welcome_bonus integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- loyalty_transactions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  sale_id uuid REFERENCES public.fiscal_documents(id),
  type text NOT NULL,
  points integer NOT NULL,
  balance_after integer NOT NULL DEFAULT 0,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- tef_configs
CREATE TABLE IF NOT EXISTS public.tef_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) UNIQUE,
  provider text NOT NULL DEFAULT 'mercado_pago',
  api_key text,
  api_secret text,
  merchant_id text,
  terminal_id text DEFAULT '01',
  environment text NOT NULL DEFAULT 'sandbox',
  auto_confirm boolean NOT NULL DEFAULT true,
  max_installments integer NOT NULL DEFAULT 12,
  accepted_brands text[] DEFAULT ARRAY['visa','mastercard','elo'],
  is_active boolean NOT NULL DEFAULT false,
  hardware_model text,
  connection_type text DEFAULT 'api',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- tef_transactions
CREATE TABLE IF NOT EXISTS public.tef_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  session_id uuid REFERENCES public.cash_sessions(id),
  sale_id uuid REFERENCES public.fiscal_documents(id),
  provider text NOT NULL,
  type text NOT NULL DEFAULT 'debit',
  amount numeric NOT NULL,
  status tef_status NOT NULL DEFAULT 'iniciado',
  nsu text,
  auth_code text,
  card_brand text,
  card_last_digits text,
  installments integer DEFAULT 1,
  mp_payment_id text,
  error_message text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- telemetry
CREATE TABLE IF NOT EXISTS public.telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  period_date date NOT NULL,
  total_sales numeric DEFAULT 0,
  sales_count integer DEFAULT 0,
  products_count integer DEFAULT 0,
  clients_count integer DEFAULT 0,
  avg_ticket numeric DEFAULT 0,
  top_products jsonb,
  top_payment_methods jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, period_date)
);

-- processing_jobs
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  type text NOT NULL DEFAULT 'sped',
  status text NOT NULL DEFAULT 'processing',
  progress integer DEFAULT 0,
  result jsonb,
  error text,
  params jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'percentage',
  value numeric NOT NULL DEFAULT 0,
  min_quantity integer DEFAULT 1,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  applies_to text DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- promotion_items
CREATE TABLE IF NOT EXISTS public.promotion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- purchase_orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  supplier_name text,
  status text NOT NULL DEFAULT 'rascunho',
  total numeric NOT NULL DEFAULT 0,
  notes text,
  expected_delivery date,
  received_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- purchase_order_items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  received_quantity numeric DEFAULT 0,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- quotes
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  client_id uuid REFERENCES public.clients(id),
  client_name text,
  status text NOT NULL DEFAULT 'rascunho',
  total numeric NOT NULL DEFAULT 0,
  items_json jsonb,
  valid_until date,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  name text NOT NULL,
  yield_quantity numeric NOT NULL DEFAULT 1,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- recipe_ingredients
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  quantity numeric NOT NULL DEFAULT 0,
  unit text DEFAULT 'UN',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- production_orders
CREATE TABLE IF NOT EXISTS public.production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id),
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- production_order_items
CREATE TABLE IF NOT EXISTS public.production_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity_required numeric NOT NULL,
  unit_cost numeric DEFAULT 0,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- resellers
CREATE TABLE IF NOT EXISTS public.resellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  brand_name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#ffffff',
  custom_domain text,
  commission_rate numeric NOT NULL DEFAULT 20,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- reseller_plans
CREATE TABLE IF NOT EXISTS public.reseller_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  name text NOT NULL,
  plan_key text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- reseller_licenses
CREATE TABLE IF NOT EXISTS public.reseller_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  company_id uuid REFERENCES public.companies(id),
  plan_id uuid REFERENCES public.reseller_plans(id),
  user_email text,
  status text NOT NULL DEFAULT 'pending',
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- reseller_commissions
CREATE TABLE IF NOT EXISTS public.reseller_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.resellers(id),
  license_id uuid REFERENCES public.reseller_licenses(id),
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTE 4: ÍNDICES (não-PK)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_action_logs_company ON public.action_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON public.action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_user ON public.action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_company ON public.backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_company_date ON public.bank_transactions(company_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled ON public.bank_transactions(company_id, reconciled);
CREATE INDEX IF NOT EXISTS idx_card_admin_company ON public.card_administrators(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_company ON public.cash_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_contingencies_company_id ON public.contingencies(company_id);
CREATE INDEX IF NOT EXISTS idx_daily_closings_company_date ON public.daily_closings(company_id, closing_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_company_due ON public.financial_entries(company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_company_type ON public.financial_entries(company_id, type, status);
CREATE INDEX IF NOT EXISTS idx_financial_entries_cost_center ON public.financial_entries(company_id, cost_center);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_logs_company_id ON public.fiscal_audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_logs_created_at ON public.fiscal_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_company_id ON public.fiscal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_created_at ON public.fiscal_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_doc_type ON public.fiscal_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_documents_status ON public.fiscal_documents(status);
CREATE INDEX IF NOT EXISTS idx_icms_st_rules_lookup ON public.icms_st_rules(company_id, uf_origin, uf_destination, ncm);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client ON public.loyalty_transactions(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_company ON public.loyalty_transactions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_mp_payment ON public.payment_history(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_company ON public.pix_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_pix_payments_external_ref ON public.pix_payments(external_reference);
CREATE INDEX IF NOT EXISTS idx_pix_payments_status ON public.pix_payments(status);
CREATE INDEX IF NOT EXISTS idx_products_fiscal_category ON public.products(fiscal_category_id);
CREATE INDEX IF NOT EXISTS idx_promotion_items_product ON public.promotion_items(product_id);
CREATE INDEX IF NOT EXISTS idx_promotion_items_promotion ON public.promotion_items(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(company_id, is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_company ON public.promotions(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_user ON public.subscriptions(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_company ON public.tef_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_session ON public.tef_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_tef_transactions_status ON public.tef_transactions(status);
CREATE INDEX IF NOT EXISTS idx_telemetry_company_period ON public.telemetry(company_id, period_date DESC);

-- ============================================================
-- PARTE 5: FUNÇÕES
-- ============================================================

-- Utility: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Auth: handle_new_user (trigger on auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END; $$;

-- Auto-assign admin on company creation
CREATE OR REPLACE FUNCTION public.auto_assign_company_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.company_users (user_id, company_id, role)
  VALUES (auth.uid(), NEW.id, 'admin');
  RETURN NEW;
END; $$;

-- Seed default fiscal categories
CREATE OR REPLACE FUNCTION public.seed_default_fiscal_categories()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(NEW.tax_regime, 'simples_nacional') = 'simples_nacional' THEN
    INSERT INTO public.fiscal_categories (company_id, name, regime, operation_type, product_type, cfop, csosn, icms_rate, pis_rate, cofins_rate)
    VALUES
      (NEW.id, 'SN - Normal Interna', 'simples_nacional', 'interna', 'normal', '5102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - Normal Interestadual', 'simples_nacional', 'interestadual', 'normal', '6102', '102', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interna', 'simples_nacional', 'interna', 'st', '5405', '500', 0, 1.65, 7.60),
      (NEW.id, 'SN - ST Interestadual', 'simples_nacional', 'interestadual', 'st', '6404', '500', 0, 1.65, 7.60);
  END IF;
  RETURN NEW;
END; $$;

-- Security helpers
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin_or_manager(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND role IN ('admin', 'gerente') AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT company_id FROM public.company_users
  WHERE user_id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_reseller_owner(_reseller_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.resellers
    WHERE id = _reseller_id AND owner_user_id = auth.uid()
  )
$$;

-- Stock auto-update
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.products SET stock_quantity = NEW.new_stock, updated_at = now() WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;

-- Product label sync
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

-- TEF encryption
CREATE OR REPLACE FUNCTION public.encrypt_tef_secrets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE encryption_key text;
BEGIN
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := encode(digest(gen_random_uuid()::text || NEW.company_id::text, 'sha256'), 'hex');
  END IF;
  IF NEW.api_key IS NOT NULL AND NEW.api_key != '' AND NOT starts_with(COALESCE(NEW.api_key, ''), '\xc3') THEN
    NEW.api_key := encode(pgp_sym_encrypt(NEW.api_key, encryption_key), 'base64');
  END IF;
  IF NEW.api_secret IS NOT NULL AND NEW.api_secret != '' AND NOT starts_with(COALESCE(NEW.api_secret, ''), '\xc3') THEN
    NEW.api_secret := encode(pgp_sym_encrypt(NEW.api_secret, encryption_key), 'base64');
  END IF;
  IF NEW.merchant_id IS NOT NULL AND NEW.merchant_id != '' AND NOT starts_with(COALESCE(NEW.merchant_id, ''), '\xc3') THEN
    NEW.merchant_id := encode(pgp_sym_encrypt(NEW.merchant_id, encryption_key), 'base64');
  END IF;
  RETURN NEW;
END; $$;

-- TEF decryption
CREATE OR REPLACE FUNCTION public.get_decrypted_tef_config(p_company_id uuid)
RETURNS TABLE(id uuid, company_id uuid, provider text, api_key text, api_secret text, merchant_id text, terminal_id text, environment text, auto_confirm boolean, max_installments integer, accepted_brands text[], is_active boolean, hardware_model text, connection_type text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE encryption_key text;
BEGIN
  IF NOT is_company_member(p_company_id) THEN RAISE EXCEPTION 'Access denied'; END IF;
  encryption_key := encode(digest(current_setting('app.settings.service_role_key', true), 'sha256'), 'hex');
  RETURN QUERY SELECT t.id, t.company_id, t.provider,
    CASE WHEN t.api_key IS NOT NULL AND t.api_key != '' THEN COALESCE(pgp_sym_decrypt(decode(t.api_key, 'base64'), encryption_key)::text, t.api_key) ELSE t.api_key END,
    CASE WHEN t.api_secret IS NOT NULL AND t.api_secret != '' THEN COALESCE(pgp_sym_decrypt(decode(t.api_secret, 'base64'), encryption_key)::text, t.api_secret) ELSE t.api_secret END,
    CASE WHEN t.merchant_id IS NOT NULL AND t.merchant_id != '' THEN COALESCE(pgp_sym_decrypt(decode(t.merchant_id, 'base64'), encryption_key)::text, t.merchant_id) ELSE t.merchant_id END,
    t.terminal_id, t.environment, t.auto_confirm, t.max_installments, t.accepted_brands, t.is_active, t.hardware_model, t.connection_type
  FROM public.tef_configs t WHERE t.company_id = p_company_id;
END; $$;

-- Daily profit report
CREATE OR REPLACE FUNCTION public.get_daily_profit_report(p_company_id uuid, p_date date)
RETURNS TABLE(total_revenue numeric, total_cost numeric, total_sales bigint, profit numeric, margin numeric, by_payment jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result RECORD;
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT fd.total_value, fd.items_json, fd.payment_method
    FROM public.fiscal_documents fd
    WHERE fd.company_id = p_company_id AND fd.doc_type = 'nfce' AND fd.status != 'cancelada'::fiscal_doc_status AND DATE(fd.created_at) = p_date
  ), revenue_agg AS (
    SELECT COALESCE(SUM(fs.total_value), 0) AS rev, COUNT(*) AS cnt FROM filtered_sales fs
  ), cost_agg AS (
    SELECT COALESCE(SUM(COALESCE((item->>'cost_price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 1)), 0) AS cst
    FROM filtered_sales fs, LATERAL jsonb_array_elements(COALESCE(fs.items_json, '[]'::jsonb)) AS item
  ), payment_agg AS (
    SELECT COALESCE(jsonb_object_agg(COALESCE(fs.payment_method, 'outros'), total), '{}'::jsonb) AS bp
    FROM (SELECT fs2.payment_method, SUM(fs2.total_value) AS total FROM filtered_sales fs2 GROUP BY fs2.payment_method) fs
  )
  SELECT ra.rev, ca.cst, ra.cnt, ra.rev - ca.cst,
    CASE WHEN ra.rev > 0 THEN ((ra.rev - ca.cst) / ra.rev) * 100 ELSE 0 END, pa.bp
  FROM revenue_agg ra, cost_agg ca, payment_agg pa;
END; $$;

-- ============================================================
-- PARTE 6: TRIGGERS
-- ============================================================

-- Auth trigger (new user → profile)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Company → auto admin + seed fiscal categories
CREATE OR REPLACE TRIGGER on_company_created_auto_admin
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_company_admin();

CREATE OR REPLACE TRIGGER on_company_created_seed_fiscal
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_fiscal_categories();

-- Stock movement → update product stock
CREATE OR REPLACE TRIGGER on_stock_movement_update_stock
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- Product change → label sync
CREATE OR REPLACE TRIGGER on_product_change_label_sync
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_product_label_sync();

-- TEF config → encrypt secrets
CREATE OR REPLACE TRIGGER on_tef_config_encrypt
  BEFORE INSERT OR UPDATE ON public.tef_configs
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_tef_secrets();

-- ============================================================
-- PARTE 7: ENABLE RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icms_st_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contingencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tef_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tef_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_commissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PARTE 8: RLS POLICIES
-- ============================================================

-- === profiles ===
CREATE POLICY "Users can view accessible profiles" ON public.profiles FOR SELECT USING (
  (auth.uid() = id) OR (id IN (
    SELECT cu2.user_id FROM company_users cu2
    WHERE cu2.company_id IN (SELECT cu1.company_id FROM company_users cu1 WHERE cu1.user_id = auth.uid() AND cu1.is_active = true) AND cu2.is_active = true
  ))
);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === user_roles ===
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === companies ===
CREATE POLICY "Members can view their companies" ON public.companies FOR SELECT USING (is_company_member(id));
CREATE POLICY "Authenticated can create company" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update company" ON public.companies FOR UPDATE USING (is_company_admin_or_manager(id));
CREATE POLICY "Super admins can view all companies" ON public.companies FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update all companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === company_users ===
CREATE POLICY "Admins can view company users" ON public.company_users FOR SELECT USING (is_company_admin_or_manager(company_id) OR user_id = auth.uid());
CREATE POLICY "Admins can add company users" ON public.company_users FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update company users" ON public.company_users FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can remove company users" ON public.company_users FOR DELETE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Super admins can view all company_users" ON public.company_users FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === products ===
CREATE POLICY "Members can view products" ON public.products FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create products" ON public.products FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === clients ===
CREATE POLICY "Members can view clients" ON public.clients FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create clients" ON public.clients FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === suppliers ===
CREATE POLICY "Members can view suppliers" ON public.suppliers FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === carriers ===
CREATE POLICY "Members can view carriers" ON public.carriers FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create carriers" ON public.carriers FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update carriers" ON public.carriers FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete carriers" ON public.carriers FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === employees ===
CREATE POLICY "Admins can view employees" ON public.employees FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can create employees" ON public.employees FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update employees" ON public.employees FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete employees" ON public.employees FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === fiscal_categories ===
CREATE POLICY "Members can view fiscal categories" ON public.fiscal_categories FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create fiscal categories" ON public.fiscal_categories FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update fiscal categories" ON public.fiscal_categories FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete fiscal categories" ON public.fiscal_categories FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === fiscal_configs ===
CREATE POLICY "Members can view fiscal configs" ON public.fiscal_configs FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can manage fiscal configs" ON public.fiscal_configs FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update fiscal configs" ON public.fiscal_configs FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete fiscal configs" ON public.fiscal_configs FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === fiscal_documents ===
CREATE POLICY "Members can view fiscal docs" ON public.fiscal_documents FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create fiscal docs" ON public.fiscal_documents FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update fiscal docs" ON public.fiscal_documents FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- === fiscal_audit_logs ===
CREATE POLICY "Admins can view audit logs" ON public.fiscal_audit_logs FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "System can insert audit logs" ON public.fiscal_audit_logs FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id));

-- === icms_st_rules ===
CREATE POLICY "Members can view ST rules" ON public.icms_st_rules FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create ST rules" ON public.icms_st_rules FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update ST rules" ON public.icms_st_rules FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete ST rules" ON public.icms_st_rules FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === contingencies ===
CREATE POLICY "Members can view contingencies" ON public.contingencies FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create contingencies" ON public.contingencies FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update contingencies" ON public.contingencies FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- === cash_sessions ===
CREATE POLICY "Members can view cash sessions" ON public.cash_sessions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create cash sessions" ON public.cash_sessions FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update cash sessions" ON public.cash_sessions FOR UPDATE USING (is_company_member(company_id));

-- === cash_movements ===
CREATE POLICY "Members can view cash movements" ON public.cash_movements FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create cash movements" ON public.cash_movements FOR INSERT WITH CHECK (is_company_member(company_id));

-- === stock_movements ===
CREATE POLICY "Members can view stock movements" ON public.stock_movements FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create stock movements" ON public.stock_movements FOR INSERT WITH CHECK (is_company_member(company_id));

-- === financial_entries ===
CREATE POLICY "Admins can view financial entries" ON public.financial_entries FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Members can create financial entries" ON public.financial_entries FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update financial entries" ON public.financial_entries FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete financial entries" ON public.financial_entries FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === daily_closings ===
CREATE POLICY "Members can view daily closings" ON public.daily_closings FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create daily closings" ON public.daily_closings FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update daily closings" ON public.daily_closings FOR UPDATE USING (is_company_admin_or_manager(company_id));

-- === action_logs ===
CREATE POLICY "Admins can view action logs" ON public.action_logs FOR SELECT TO authenticated USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Members can insert action logs" ON public.action_logs FOR INSERT TO authenticated WITH CHECK (is_company_member(company_id));
CREATE POLICY "Super admins can view all action_logs" ON public.action_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === backup_history ===
CREATE POLICY "Admins can view backup history" ON public.backup_history FOR SELECT TO authenticated USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can insert backup history" ON public.backup_history FOR INSERT TO authenticated WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete backup history" ON public.backup_history FOR DELETE TO authenticated USING (is_company_admin_or_manager(company_id));

-- === bank_transactions ===
CREATE POLICY "Members can view bank transactions" ON public.bank_transactions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create bank transactions" ON public.bank_transactions FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update bank transactions" ON public.bank_transactions FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete bank transactions" ON public.bank_transactions FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === card_administrators ===
CREATE POLICY "Members can view card administrators" ON public.card_administrators FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create card administrators" ON public.card_administrators FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update card administrators" ON public.card_administrators FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete card administrators" ON public.card_administrators FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === subscriptions ===
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Super admins can view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === payment_history ===
CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage payment history" ON public.payment_history FOR ALL USING (auth.uid() = user_id);

-- === permissions ===
CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage permissions via insert" ON public.permissions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));
CREATE POLICY "Only admins can manage permissions via update" ON public.permissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));
CREATE POLICY "Only admins can manage permissions via delete" ON public.permissions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));

-- === discount_limits ===
CREATE POLICY "Authenticated can view discount limits" ON public.discount_limits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert discount limits" ON public.discount_limits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));
CREATE POLICY "Admins can update discount limits" ON public.discount_limits FOR UPDATE USING (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));
CREATE POLICY "Admins can delete discount limits" ON public.discount_limits FOR DELETE USING (EXISTS (SELECT 1 FROM company_users WHERE company_users.user_id = auth.uid() AND company_users.role = 'admin' AND company_users.is_active = true));

-- === pix_payments ===
CREATE POLICY "Members can view pix payments" ON public.pix_payments FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create pix payments" ON public.pix_payments FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update pix payments" ON public.pix_payments FOR UPDATE USING (is_company_member(company_id));

-- === product_categories ===
CREATE POLICY "Members can view categories" ON public.product_categories FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create categories" ON public.product_categories FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update categories" ON public.product_categories FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete categories" ON public.product_categories FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === product_labels ===
CREATE POLICY "Members can view labels" ON public.product_labels FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create labels" ON public.product_labels FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update labels" ON public.product_labels FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Admins can delete labels" ON public.product_labels FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === product_lots ===
CREATE POLICY "Members can view product lots" ON public.product_lots FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create product lots" ON public.product_lots FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update product lots" ON public.product_lots FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete product lots" ON public.product_lots FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === inventory_counts ===
CREATE POLICY "Members can view inventory counts" ON public.inventory_counts FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create inventory counts" ON public.inventory_counts FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update inventory counts" ON public.inventory_counts FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete inventory counts" ON public.inventory_counts FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === inventory_count_items ===
CREATE POLICY "Members can view inventory items" ON public.inventory_count_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create inventory items" ON public.inventory_count_items FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update inventory items" ON public.inventory_count_items FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Admins can delete inventory items" ON public.inventory_count_items FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === loyalty_config ===
CREATE POLICY "Members can view loyalty config" ON public.loyalty_config FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can insert loyalty config" ON public.loyalty_config FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update loyalty config" ON public.loyalty_config FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete loyalty config" ON public.loyalty_config FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === loyalty_transactions ===
CREATE POLICY "Members can view loyalty transactions" ON public.loyalty_transactions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create loyalty transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (is_company_member(company_id));

-- === tef_configs ===
CREATE POLICY "Members can view TEF configs" ON public.tef_configs FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can view tef configs" ON public.tef_configs FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can manage TEF configs" ON public.tef_configs FOR ALL USING (is_company_admin_or_manager(company_id)) WITH CHECK (is_company_admin_or_manager(company_id));

-- === tef_transactions ===
CREATE POLICY "Members can view tef transactions" ON public.tef_transactions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create tef transactions" ON public.tef_transactions FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update tef transactions" ON public.tef_transactions FOR UPDATE USING (is_company_member(company_id));

-- === telemetry ===
CREATE POLICY "Admins can view telemetry" ON public.telemetry FOR SELECT USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Members can insert telemetry" ON public.telemetry FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Super admins can view all telemetry" ON public.telemetry FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

-- === processing_jobs ===
CREATE POLICY "Members can view own jobs" ON public.processing_jobs FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create jobs" ON public.processing_jobs FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Service can update jobs" ON public.processing_jobs FOR UPDATE USING (is_company_member(company_id));

-- === promotions ===
CREATE POLICY "Members can view promotions" ON public.promotions FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create promotions" ON public.promotions FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update promotions" ON public.promotions FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete promotions" ON public.promotions FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === promotion_items ===
CREATE POLICY "Members can view promotion items" ON public.promotion_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create promotion items" ON public.promotion_items FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete promotion items" ON public.promotion_items FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === purchase_orders ===
CREATE POLICY "Members can view purchase orders" ON public.purchase_orders FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create purchase orders" ON public.purchase_orders FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update purchase orders" ON public.purchase_orders FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete purchase orders" ON public.purchase_orders FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === purchase_order_items ===
CREATE POLICY "Members can view purchase order items" ON public.purchase_order_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create purchase order items" ON public.purchase_order_items FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update purchase order items" ON public.purchase_order_items FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Admins can delete purchase order items" ON public.purchase_order_items FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === quotes ===
CREATE POLICY "Members can view quotes" ON public.quotes FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create quotes" ON public.quotes FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update quotes" ON public.quotes FOR UPDATE USING (is_company_member(company_id));
CREATE POLICY "Admins can delete quotes" ON public.quotes FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === recipes ===
CREATE POLICY "Members can view recipes" ON public.recipes FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create recipes" ON public.recipes FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update recipes" ON public.recipes FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete recipes" ON public.recipes FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === recipe_ingredients ===
CREATE POLICY "Members can view recipe ingredients" ON public.recipe_ingredients FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create recipe ingredients" ON public.recipe_ingredients FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update recipe ingredients" ON public.recipe_ingredients FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete recipe ingredients" ON public.recipe_ingredients FOR DELETE USING (is_company_admin_or_manager(company_id));

-- === production_orders ===
CREATE POLICY "Members can view production orders" ON public.production_orders FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create production orders" ON public.production_orders FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Members can update production orders" ON public.production_orders FOR UPDATE USING (is_company_member(company_id));

-- === production_order_items ===
CREATE POLICY "Members can view production items" ON public.production_order_items FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create production items" ON public.production_order_items FOR INSERT WITH CHECK (is_company_member(company_id));

-- === resellers ===
CREATE POLICY "Owners can view their reseller" ON public.resellers FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Authenticated can create reseller" ON public.resellers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());
CREATE POLICY "Owners can update their reseller" ON public.resellers FOR UPDATE USING (owner_user_id = auth.uid());

-- === reseller_plans ===
CREATE POLICY "Reseller owners can view plans" ON public.reseller_plans FOR SELECT USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can create plans" ON public.reseller_plans FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can update plans" ON public.reseller_plans FOR UPDATE USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can delete plans" ON public.reseller_plans FOR DELETE USING (is_reseller_owner(reseller_id));

-- === reseller_licenses ===
CREATE POLICY "Reseller owners can view licenses" ON public.reseller_licenses FOR SELECT USING (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can create licenses" ON public.reseller_licenses FOR INSERT WITH CHECK (is_reseller_owner(reseller_id));
CREATE POLICY "Reseller owners can update licenses" ON public.reseller_licenses FOR UPDATE USING (is_reseller_owner(reseller_id));

-- === reseller_commissions ===
CREATE POLICY "Reseller owners can view commissions" ON public.reseller_commissions FOR SELECT USING (is_reseller_owner(reseller_id));

-- ============================================================
-- PARTE 9: STORAGE BUCKETS + POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('company-backups', 'company-backups', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reseller-logos', 'reseller-logos', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can view backups" ON storage.objects FOR SELECT USING (bucket_id = 'company-backups' AND is_company_admin_or_manager((storage.foldername(name))[1]::uuid));
CREATE POLICY "Admins can upload backups" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-backups' AND is_company_admin_or_manager((storage.foldername(name))[1]::uuid));
CREATE POLICY "Admins can delete backups" ON storage.objects FOR DELETE USING (bucket_id = 'company-backups' AND is_company_admin_or_manager((storage.foldername(name))[1]::uuid));

CREATE POLICY "Company logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Users can upload company logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update company logos" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete company logos" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Company members can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Company members can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Company members can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Reseller logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reseller-logos');
CREATE POLICY "Reseller owners can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Reseller owners can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Reseller owners can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'reseller-logos' AND auth.uid() IS NOT NULL);

-- ============================================================
-- PARTE 10: GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================
