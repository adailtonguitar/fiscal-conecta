
-- 1. Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 6. Allow super_admin to read ALL companies (bypass company membership)
CREATE POLICY "Super admins can view all companies"
  ON public.companies FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 7. Allow super_admin to update any company (for kill switch)
CREATE POLICY "Super admins can update all companies"
  ON public.companies FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 8. Allow super_admin to read all telemetry
CREATE POLICY "Super admins can view all telemetry"
  ON public.telemetry FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));
