
-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  trade_name TEXT,
  cpf_cnpj TEXT,
  ie TEXT,
  email TEXT,
  phone TEXT,
  phone2 TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  address_ibge_code TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view clients" ON public.clients FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create clients" ON public.clients FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  ie TEXT,
  email TEXT,
  phone TEXT,
  contact_name TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view suppliers" ON public.suppliers FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create suppliers" ON public.suppliers FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update suppliers" ON public.suppliers FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID,
  name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  role TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  admission_date DATE,
  salary NUMERIC DEFAULT 0,
  address_street TEXT,
  address_number TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view employees" ON public.employees FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Admins can create employees" ON public.employees FOR INSERT WITH CHECK (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can update employees" ON public.employees FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete employees" ON public.employees FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carriers (Transportadoras) table
CREATE TABLE public.carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  ie TEXT,
  email TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  antt_code TEXT,
  vehicle_plate TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view carriers" ON public.carriers FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create carriers" ON public.carriers FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update carriers" ON public.carriers FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete carriers" ON public.carriers FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON public.carriers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view categories" ON public.product_categories FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create categories" ON public.product_categories FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update categories" ON public.product_categories FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete categories" ON public.product_categories FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fiscal categories (NCM groups, CFOP, CST, etc.)
CREATE TABLE public.fiscal_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  type TEXT NOT NULL, -- 'ncm', 'cfop', 'cst_icms', 'cst_pis', 'cst_cofins', 'csosn'
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiscal_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view fiscal categories" ON public.fiscal_categories FOR SELECT USING (is_company_member(company_id));
CREATE POLICY "Members can create fiscal categories" ON public.fiscal_categories FOR INSERT WITH CHECK (is_company_member(company_id));
CREATE POLICY "Admins can update fiscal categories" ON public.fiscal_categories FOR UPDATE USING (is_company_admin_or_manager(company_id));
CREATE POLICY "Admins can delete fiscal categories" ON public.fiscal_categories FOR DELETE USING (is_company_admin_or_manager(company_id));

CREATE TRIGGER update_fiscal_categories_updated_at BEFORE UPDATE ON public.fiscal_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
