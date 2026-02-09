/**
 * AuditService — centralized audit/action logging.
 */
import { supabase } from "@/integrations/supabase/client";

export class AuditService {
  static async log(params: {
    companyId: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    details?: string;
    metadata?: Record<string, unknown>;
  }) {
    await supabase.from("action_logs").insert({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      module: params.module,
      details: params.details,
      metadata: params.metadata as any,
    });
  }
}
