
-- Restrict employees SELECT to admin/gerente only
DROP POLICY IF EXISTS "Members can view employees" ON public.employees;
CREATE POLICY "Admins can view employees"
  ON public.employees FOR SELECT
  USING (is_company_admin_or_manager(company_id));

-- Restrict tef_configs SELECT to admin/gerente only
DROP POLICY IF EXISTS "Members can view tef configs" ON public.tef_configs;
CREATE POLICY "Admins can view tef configs"
  ON public.tef_configs FOR SELECT
  USING (is_company_admin_or_manager(company_id));
