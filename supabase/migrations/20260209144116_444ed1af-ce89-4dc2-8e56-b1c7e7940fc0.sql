
-- Create storage bucket for company backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-backups', 'company-backups', false);

-- Only company admins/managers can access their backups
CREATE POLICY "Admins can upload backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-backups'
  AND public.is_company_admin_or_manager((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Admins can view backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-backups'
  AND public.is_company_admin_or_manager((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Admins can delete backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-backups'
  AND public.is_company_admin_or_manager((storage.foldername(name))[1]::uuid)
);

-- Table to track backup history
CREATE TABLE public.backup_history (
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

ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup history"
ON public.backup_history FOR SELECT
TO authenticated
USING (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can insert backup history"
ON public.backup_history FOR INSERT
TO authenticated
WITH CHECK (is_company_admin_or_manager(company_id));

CREATE POLICY "Admins can delete backup history"
ON public.backup_history FOR DELETE
TO authenticated
USING (is_company_admin_or_manager(company_id));

CREATE INDEX idx_backup_history_company ON public.backup_history(company_id);
