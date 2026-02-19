
-- Processing jobs for heavy async tasks (SPED, etc.)
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  type TEXT NOT NULL DEFAULT 'sped',
  status TEXT NOT NULL DEFAULT 'processing',
  progress INTEGER DEFAULT 0,
  result JSONB,
  error TEXT,
  params JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own jobs" ON public.processing_jobs
  FOR SELECT USING (is_company_member(company_id));

CREATE POLICY "Members can create jobs" ON public.processing_jobs
  FOR INSERT WITH CHECK (is_company_member(company_id));

CREATE POLICY "Service can update jobs" ON public.processing_jobs
  FOR UPDATE USING (is_company_member(company_id));
