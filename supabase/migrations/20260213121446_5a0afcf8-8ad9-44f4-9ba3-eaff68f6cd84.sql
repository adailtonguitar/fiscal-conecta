-- Restrict financial_entries SELECT to admin/gerente only
DROP POLICY IF EXISTS "Members can view financial entries" ON public.financial_entries;
CREATE POLICY "Admins can view financial entries"
  ON public.financial_entries FOR SELECT
  USING (is_company_admin_or_manager(company_id));