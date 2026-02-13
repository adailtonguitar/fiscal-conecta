/**
 * SyncEngine — orchestrates pushing local changes to cloud.
 * 
 * Strategy:
 * 1. Individual record sync: pushes pending sync_log entries to Supabase
 * 2. Daily summary: aggregates local sales/financial data into a daily summary
 */
import { supabase } from "@/integrations/supabase/client";
import { DataLayer, getDB } from "@/lib/local-db";

const BATCH_SIZE = 50;

/** Maps local table names to Supabase table names */
const TABLE_MAP: Record<string, string> = {
  products: "products",
  clients: "clients",
  fiscal_documents: "fiscal_documents",
  stock_movements: "stock_movements",
  cash_sessions: "cash_sessions",
  cash_movements: "cash_movements",
  financial_entries: "financial_entries",
};

/** Fields that need boolean conversion (SQLite int → Supabase bool) */
const BOOLEAN_FIELDS: Record<string, string[]> = {
  products: ["is_active"],
  clients: ["is_active"],
  fiscal_documents: ["is_contingency"],
};

/** Fields that are JSON strings in SQLite but objects in Supabase */
const JSON_FIELDS: Record<string, string[]> = {
  fiscal_documents: ["items_json"],
};

interface SyncLogEntry {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  payload: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

export interface SyncStats {
  pending: number;
  synced: number;
  failed: number;
  lastSyncAt: string | null;
}

function convertPayloadForCloud(
  tableName: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...payload };

  // Convert SQLite integers back to booleans
  const boolFields = BOOLEAN_FIELDS[tableName] || [];
  for (const field of boolFields) {
    if (field in result) {
      result[field] = result[field] === 1 || result[field] === true;
    }
  }

  // Parse JSON strings back to objects
  const jsonFields = JSON_FIELDS[tableName] || [];
  for (const field of jsonFields) {
    if (field in result && typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field] as string);
      } catch {
        // leave as string if parse fails
      }
    }
  }

  // Remove local-only fields
  delete result.synced_at;

  return result;
}

export const SyncEngine = {
  /**
   * Get current sync stats.
   */
  async getStats(): Promise<SyncStats> {
    const db = await getDB();

    const pendingResult = await db.query(
      `SELECT COUNT(*) as count FROM sync_log WHERE status = 'pending'`
    );
    const syncedResult = await db.query(
      `SELECT COUNT(*) as count FROM sync_log WHERE status = 'synced'`
    );
    const failedResult = await db.query(
      `SELECT COUNT(*) as count FROM sync_log WHERE status = 'failed'`
    );

    const lastSync = await DataLayer.getMeta("last_cloud_sync");

    return {
      pending: pendingResult.values?.[0]?.count ?? 0,
      synced: syncedResult.values?.[0]?.count ?? 0,
      failed: failedResult.values?.[0]?.count ?? 0,
      lastSyncAt: lastSync,
    };
  },

  /**
   * Push pending sync_log entries to Supabase.
   * Processes in batches, skipping unsupported tables.
   */
  async pushPending(): Promise<{ synced: number; failed: number }> {
    const result = await DataLayer.raw<SyncLogEntry>(
      `SELECT * FROM sync_log WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [BATCH_SIZE]
    );

    if (result.error || result.data.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const entry of result.data) {
      const supabaseTable = TABLE_MAP[entry.table_name];
      if (!supabaseTable) {
        // Unknown table, mark as failed
        await DataLayer.execute(
          `UPDATE sync_log SET status = 'failed', error = ? WHERE id = ?`,
          [`Unknown table: ${entry.table_name}`, entry.id]
        );
        failed++;
        continue;
      }

      try {
        if (entry.operation === "INSERT" && entry.payload) {
          const payload = convertPayloadForCloud(
            entry.table_name,
            JSON.parse(entry.payload)
          );
          const { error } = await supabase
            .from(supabaseTable as any)
            .upsert(payload as any);
          if (error) throw error;
        } else if (entry.operation === "UPDATE" && entry.payload) {
          const payload = convertPayloadForCloud(
            entry.table_name,
            JSON.parse(entry.payload)
          );
          const { error } = await supabase
            .from(supabaseTable as any)
            .update(payload as any)
            .eq("id", entry.record_id);
          if (error) throw error;
        } else if (entry.operation === "DELETE") {
          const { error } = await supabase
            .from(supabaseTable as any)
            .delete()
            .eq("id", entry.record_id);
          if (error) throw error;
        }

        // Mark as synced
        await DataLayer.execute(
          `UPDATE sync_log SET status = 'synced', synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), entry.id]
        );

        // Also mark the source record as synced
        await DataLayer.execute(
          `UPDATE ${entry.table_name} SET synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), entry.record_id]
        );

        synced++;
      } catch (err: any) {
        const isDuplicate = err.message?.includes("duplicate") || err.code === "23505";
        if (isDuplicate && entry.operation === "INSERT") {
          // Duplicate → treat as already synced
          await DataLayer.execute(
            `UPDATE sync_log SET status = 'synced', synced_at = ? WHERE id = ?`,
            [new Date().toISOString(), entry.id]
          );
          synced++;
        } else {
          await DataLayer.execute(
            `UPDATE sync_log SET status = 'failed', error = ? WHERE id = ?`,
            [err.message || "Unknown error", entry.id]
          );
          failed++;
        }
      }
    }

    if (synced > 0) {
      await DataLayer.setMeta("last_cloud_sync", new Date().toISOString());
    }

    return { synced, failed };
  },

  /**
   * Generate and push a daily summary to the cloud.
   */
  async pushDailySummary(companyId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const db = await getDB();

    // Sales summary
    const salesResult = await db.query(
      `SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(total_value), 0) as total_value,
        COALESCE(SUM(CASE WHEN payment_method = 'dinheiro' THEN total_value ELSE 0 END), 0) as total_dinheiro,
        COALESCE(SUM(CASE WHEN payment_method = 'debito' THEN total_value ELSE 0 END), 0) as total_debito,
        COALESCE(SUM(CASE WHEN payment_method = 'credito' THEN total_value ELSE 0 END), 0) as total_credito,
        COALESCE(SUM(CASE WHEN payment_method = 'pix' THEN total_value ELSE 0 END), 0) as total_pix
      FROM fiscal_documents
      WHERE company_id = ? AND date(created_at) = ?`,
      [companyId, today]
    );

    // Financial summary
    const financialResult = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'receber' AND status = 'pendente' THEN amount ELSE 0 END), 0) as receivables,
        COALESCE(SUM(CASE WHEN type = 'pagar' AND status = 'pendente' THEN amount ELSE 0 END), 0) as payables
      FROM financial_entries
      WHERE company_id = ?`,
      [companyId]
    );

    const salesData = salesResult.values?.[0] || {};
    const finData = financialResult.values?.[0] || {};

    // Push to cloud via edge function
    const { error } = await supabase.functions.invoke("daily-summary", {
      body: {
        company_id: companyId,
        date: today,
        sales: salesData,
        financial: finData,
      },
    });

    if (error) {
      console.error("[SyncEngine] Daily summary push failed:", error);
    } else {
      await DataLayer.setMeta(`daily_summary_${today}`, new Date().toISOString());
      console.log("[SyncEngine] Daily summary pushed for", today);
    }
  },

  /**
   * Cleanup old synced entries from sync_log (older than 7 days).
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await DataLayer.execute(
      `DELETE FROM sync_log WHERE status = 'synced' AND synced_at < ?`,
      [cutoff]
    );
  },

  /**
   * Retry failed entries (reset status to pending).
   */
  async retryFailed(): Promise<number> {
    const db = await getDB();
    const result = await db.run(
      `UPDATE sync_log SET status = 'pending', error = NULL WHERE status = 'failed'`
    );
    return result.changes?.changes ?? 0;
  },
};
