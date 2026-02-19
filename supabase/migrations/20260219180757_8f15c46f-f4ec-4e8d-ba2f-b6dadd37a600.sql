
CREATE OR REPLACE FUNCTION public.get_daily_profit_report(
  p_company_id UUID,
  p_date DATE
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_cost NUMERIC,
  total_sales BIGINT,
  profit NUMERIC,
  margin NUMERIC,
  by_payment JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result RECORD;
BEGIN
  RETURN QUERY
  WITH filtered_sales AS (
    SELECT
      fd.total_value,
      fd.items_json,
      fd.payment_method
    FROM public.fiscal_documents fd
    WHERE fd.company_id = p_company_id
      AND fd.doc_type = 'nfce'
      AND fd.status != 'cancelada'::fiscal_doc_status
      AND DATE(fd.created_at) = p_date
  ),
  revenue_agg AS (
    SELECT
      COALESCE(SUM(fs.total_value), 0) AS rev,
      COUNT(*) AS cnt
    FROM filtered_sales fs
  ),
  cost_agg AS (
    SELECT COALESCE(SUM(
      COALESCE((item->>'cost_price')::numeric, 0) * COALESCE((item->>'quantity')::numeric, 1)
    ), 0) AS cst
    FROM filtered_sales fs,
    LATERAL jsonb_array_elements(COALESCE(fs.items_json, '[]'::jsonb)) AS item
  ),
  payment_agg AS (
    SELECT COALESCE(
      jsonb_object_agg(COALESCE(fs.payment_method, 'outros'), total),
      '{}'::jsonb
    ) AS bp
    FROM (
      SELECT fs2.payment_method, SUM(fs2.total_value) AS total
      FROM filtered_sales fs2
      GROUP BY fs2.payment_method
    ) fs
  )
  SELECT
    ra.rev,
    ca.cst,
    ra.cnt,
    ra.rev - ca.cst,
    CASE WHEN ra.rev > 0 THEN ((ra.rev - ca.cst) / ra.rev) * 100 ELSE 0 END,
    pa.bp
  FROM revenue_agg ra, cost_agg ca, payment_agg pa;
END;
$$;
