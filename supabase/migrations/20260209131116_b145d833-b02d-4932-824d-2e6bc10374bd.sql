
-- Fix: restrict company creation to authenticated users only (already done via TO authenticated, but make WITH CHECK more explicit)
DROP POLICY "Authenticated can create company" ON public.companies;
CREATE POLICY "Authenticated can create company" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
