
-- Enum for company user roles
CREATE TYPE public.company_role AS ENUM ('admin', 'gerente', 'caixa');

-- Enum for fiscal document types
CREATE TYPE public.fiscal_doc_type AS ENUM ('nfce', 'nfe', 'sat');

-- Enum for fiscal document status
CREATE TYPE public.fiscal_doc_status AS ENUM ('pendente', 'autorizada', 'cancelada', 'rejeitada', 'contingencia', 'inutilizada');

-- Enum for SEFAZ environment
CREATE TYPE public.sefaz_environment AS ENUM ('homologacao', 'producao');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Companies (empresas)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT NOT NULL,
  ie TEXT,
  im TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  address_ibge_code TEXT,
  phone TEXT,
  email TEXT,
  tax_regime TEXT DEFAULT 'simples_nacional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Company users (membership)
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role company_role NOT NULL DEFAULT 'caixa',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin_or_manager(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND role IN ('admin', 'gerente') AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_users
  WHERE user_id = auth.uid() AND is_active = true
$$;

-- RLS for companies
CREATE POLICY "Members can view their companies" ON public.companies FOR SELECT USING (public.is_company_member(id));
CREATE POLICY "Admins can update company" ON public.companies FOR UPDATE USING (public.is_company_admin_or_manager(id));
CREATE POLICY "Authenticated can create company" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);

-- RLS for company_users
CREATE POLICY "Admins can view company users" ON public.company_users FOR SELECT USING (public.is_company_admin_or_manager(company_id) OR user_id = auth.uid());
CREATE POLICY "Admins can add company users" ON public.company_users FOR INSERT WITH CHECK (public.is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update company users" ON public.company_users FOR UPDATE USING (public.is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can remove company users" ON public.company_users FOR DELETE USING (public.is_company_admin_or_manager(company_id));

-- Fiscal configurations
CREATE TABLE public.fiscal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL,
  environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  serie INTEGER NOT NULL DEFAULT 1,
  next_number INTEGER NOT NULL DEFAULT 1,
  csc_id TEXT,
  csc_token TEXT,
  certificate_path TEXT,
  certificate_password_hash TEXT,
  certificate_expires_at TIMESTAMPTZ,
  sat_activation_code TEXT,
  sat_serial_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, doc_type)
);
ALTER TABLE public.fiscal_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view fiscal configs" ON public.fiscal_configs FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Admins can manage fiscal configs" ON public.fiscal_configs FOR INSERT WITH CHECK (public.is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update fiscal configs" ON public.fiscal_configs FOR UPDATE USING (public.is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete fiscal configs" ON public.fiscal_configs FOR DELETE USING (public.is_company_admin_or_manager(company_id));

-- Fiscal documents
CREATE TABLE public.fiscal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL,
  number INTEGER,
  serie INTEGER,
  access_key TEXT,
  status fiscal_doc_status NOT NULL DEFAULT 'pendente',
  environment sefaz_environment NOT NULL DEFAULT 'homologacao',
  xml_sent TEXT,
  xml_response TEXT,
  protocol_number TEXT,
  protocol_date TIMESTAMPTZ,
  rejection_reason TEXT,
  total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_cpf_cnpj TEXT,
  items_json JSONB,
  payment_method TEXT,
  is_contingency BOOLEAN NOT NULL DEFAULT false,
  contingency_type TEXT,
  contingency_reason TEXT,
  issued_by UUID REFERENCES auth.users(id),
  canceled_at TIMESTAMPTZ,
  canceled_by UUID REFERENCES auth.users(id),
  cancel_protocol TEXT,
  cancel_reason TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view fiscal docs" ON public.fiscal_documents FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create fiscal docs" ON public.fiscal_documents FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Admins can update fiscal docs" ON public.fiscal_documents FOR UPDATE USING (public.is_company_admin_or_manager(company_id));

-- Audit logs
CREATE TABLE public.fiscal_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  doc_type fiscal_doc_type,
  document_id UUID REFERENCES public.fiscal_documents(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fiscal_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.fiscal_audit_logs FOR SELECT USING (public.is_company_admin_or_manager(company_id));
CREATE POLICY "System can insert audit logs" ON public.fiscal_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_company_member(company_id));

-- Contingency records
CREATE TABLE public.contingencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type fiscal_doc_type NOT NULL,
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  documents_count INTEGER NOT NULL DEFAULT 0,
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contingencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view contingencies" ON public.contingencies FOR SELECT USING (public.is_company_member(company_id));
CREATE POLICY "Members can create contingencies" ON public.contingencies FOR INSERT WITH CHECK (public.is_company_member(company_id));
CREATE POLICY "Admins can update contingencies" ON public.contingencies FOR UPDATE USING (public.is_company_admin_or_manager(company_id));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fiscal_configs_updated_at BEFORE UPDATE ON public.fiscal_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fiscal_documents_updated_at BEFORE UPDATE ON public.fiscal_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_fiscal_documents_company_id ON public.fiscal_documents(company_id);
CREATE INDEX idx_fiscal_documents_status ON public.fiscal_documents(status);
CREATE INDEX idx_fiscal_documents_doc_type ON public.fiscal_documents(doc_type);
CREATE INDEX idx_fiscal_documents_created_at ON public.fiscal_documents(created_at);
CREATE INDEX idx_fiscal_audit_logs_company_id ON public.fiscal_audit_logs(company_id);
CREATE INDEX idx_fiscal_audit_logs_created_at ON public.fiscal_audit_logs(created_at);
CREATE INDEX idx_contingencies_company_id ON public.contingencies(company_id);

-- Auto-assign creator as admin when company is created
CREATE OR REPLACE FUNCTION public.auto_assign_company_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_users (user_id, company_id, role)
  VALUES (auth.uid(), NEW.id, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_company_admin();
