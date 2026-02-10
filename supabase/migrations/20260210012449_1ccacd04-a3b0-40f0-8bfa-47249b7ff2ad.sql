-- Allow company members to view profiles of colleagues
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view accessible profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR
  id IN (
    SELECT cu2.user_id FROM public.company_users cu2
    WHERE cu2.company_id IN (
      SELECT cu1.company_id FROM public.company_users cu1
      WHERE cu1.user_id = auth.uid() AND cu1.is_active = true
    )
    AND cu2.is_active = true
  )
);