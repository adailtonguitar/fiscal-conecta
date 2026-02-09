
-- Create permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.company_role NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  UNIQUE(role, module)
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage permissions via insert"
ON public.permissions FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

CREATE POLICY "Only admins can manage permissions via update"
ON public.permissions FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

CREATE POLICY "Only admins can manage permissions via delete"
ON public.permissions FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.company_users
  WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
));

-- Seed default permissions
INSERT INTO public.permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  ('admin', 'pdv', true, true, true, true),
  ('admin', 'dashboard', true, true, true, true),
  ('admin', 'produtos', true, true, true, true),
  ('admin', 'vendas', true, true, true, true),
  ('admin', 'caixa', true, true, true, true),
  ('admin', 'financeiro', true, true, true, true),
  ('admin', 'fiscal', true, true, true, true),
  ('admin', 'configuracoes', true, true, true, true),
  ('admin', 'usuarios', true, true, true, true),
  ('gerente', 'pdv', true, true, true, false),
  ('gerente', 'dashboard', true, true, true, false),
  ('gerente', 'produtos', true, true, true, false),
  ('gerente', 'vendas', true, true, false, false),
  ('gerente', 'caixa', true, true, true, false),
  ('gerente', 'financeiro', true, true, true, false),
  ('gerente', 'fiscal', true, true, false, false),
  ('gerente', 'configuracoes', true, false, false, false),
  ('gerente', 'usuarios', true, true, false, false),
  ('supervisor', 'pdv', true, true, true, false),
  ('supervisor', 'dashboard', true, false, false, false),
  ('supervisor', 'produtos', true, true, true, false),
  ('supervisor', 'vendas', true, true, false, false),
  ('supervisor', 'caixa', true, true, true, false),
  ('supervisor', 'financeiro', true, false, false, false),
  ('supervisor', 'fiscal', true, false, false, false),
  ('supervisor', 'configuracoes', false, false, false, false),
  ('supervisor', 'usuarios', false, false, false, false),
  ('caixa', 'pdv', true, true, false, false),
  ('caixa', 'dashboard', false, false, false, false),
  ('caixa', 'produtos', true, false, false, false),
  ('caixa', 'vendas', true, false, false, false),
  ('caixa', 'caixa', true, true, false, false),
  ('caixa', 'financeiro', false, false, false, false),
  ('caixa', 'fiscal', false, false, false, false),
  ('caixa', 'configuracoes', false, false, false, false),
  ('caixa', 'usuarios', false, false, false, false);

-- Create general action logs table
CREATE TABLE public.action_logs (
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

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can insert action logs"
ON public.action_logs FOR INSERT
TO authenticated
WITH CHECK (is_company_member(company_id));

CREATE POLICY "Admins can view action logs"
ON public.action_logs FOR SELECT
TO authenticated
USING (is_company_admin_or_manager(company_id));

CREATE INDEX idx_action_logs_company ON public.action_logs(company_id);
CREATE INDEX idx_action_logs_created ON public.action_logs(created_at DESC);
CREATE INDEX idx_action_logs_user ON public.action_logs(user_id);
