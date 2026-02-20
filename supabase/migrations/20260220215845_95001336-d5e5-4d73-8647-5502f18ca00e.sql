
-- Super admin can view all company_users
CREATE POLICY "Super admins can view all company_users"
ON public.company_users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin can view all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin can view all action_logs
CREATE POLICY "Super admins can view all action_logs"
ON public.action_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));
