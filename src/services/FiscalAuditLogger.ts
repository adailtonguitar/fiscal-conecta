/**
 * FiscalAuditLogger — logs all fiscal configuration changes
 * with before/after snapshots to fiscal_audit_logs.
 */
import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  companyId: string;
  action: string;
  details: {
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    before?: Record<string, any> | null;
    after?: Record<string, any> | null;
    changed_fields?: string[];
  };
}

/** Compute which fields actually changed between before and after */
function computeChangedFields(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined
): string[] {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const skip = new Set(["id", "company_id", "created_at", "updated_at"]);
  const changed: string[] = [];
  for (const key of keys) {
    if (skip.has(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}

export async function logFiscalAudit(params: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const changedFields = computeChangedFields(
      params.details.before,
      params.details.after
    );

    await supabase.from("fiscal_audit_logs").insert({
      company_id: params.companyId,
      user_id: user.id,
      action: params.action,
      details: {
        ...params.details,
        changed_fields: changedFields.length > 0 ? changedFields : undefined,
        user_email: user.email,
        timestamp: new Date().toISOString(),
      },
    } as any);
  } catch (e) {
    // Audit logging should never break the main flow
    console.error("Fiscal audit log failed:", e);
  }
}
