/**
 * TelemetryService — collects and sends usage metrics to the cloud.
 * Runs once per day, sending aggregated counts for the current period.
 */
import { supabase } from "@/integrations/supabase/client";
import { DataLayer } from "@/lib/local-db";
import { Capacitor } from "@capacitor/core";

const TELEMETRY_META_PREFIX = "telemetry_sent_";

export const TelemetryService = {
  /**
   * Check if telemetry was already sent today for this company.
   */
  async wasSentToday(companyId: string): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${TELEMETRY_META_PREFIX}${companyId}_${today}`;
    const val = await DataLayer.getMeta(key);
    return val === "true";
  },

  /**
   * Collect local metrics and send to cloud.
   */
  async sendDailyTelemetry(companyId: string): Promise<void> {
    if (!navigator.onLine) return;

    const already = await this.wasSentToday(companyId);
    if (already) return;

    const today = new Date().toISOString().slice(0, 10);

    try {
      const { getDB } = await import("@/lib/local-db");
      const db = await getDB();

      // Sales count & total for today
      const salesResult = await db.query(
        `SELECT COUNT(*) as cnt, COALESCE(SUM(total_value), 0) as total
         FROM fiscal_documents
         WHERE company_id = ? AND date(created_at) = ?`,
        [companyId, today]
      );

      // NFC-e and NF-e counts
      const nfceResult = await db.query(
        `SELECT COUNT(*) as cnt FROM fiscal_documents
         WHERE company_id = ? AND doc_type = 'nfce' AND date(created_at) = ?`,
        [companyId, today]
      );
      const nfeResult = await db.query(
        `SELECT COUNT(*) as cnt FROM fiscal_documents
         WHERE company_id = ? AND doc_type = 'nfe' AND date(created_at) = ?`,
        [companyId, today]
      );

      // Total products & clients
      const prodResult = await db.query(
        `SELECT COUNT(*) as cnt FROM products WHERE company_id = ?`,
        [companyId]
      );
      const clientResult = await db.query(
        `SELECT COUNT(*) as cnt FROM clients WHERE company_id = ?`,
        [companyId]
      );

      const sales = salesResult.values?.[0] || {};
      const nfce = nfceResult.values?.[0] || {};
      const nfe = nfeResult.values?.[0] || {};
      const prods = prodResult.values?.[0] || {};
      const clients = clientResult.values?.[0] || {};

      const { error } = await supabase.functions.invoke("telemetry", {
        body: {
          company_id: companyId,
          period_date: today,
          sales_count: sales.cnt ?? 0,
          sales_total: sales.total ?? 0,
          nfce_count: nfce.cnt ?? 0,
          nfe_count: nfe.cnt ?? 0,
          products_count: prods.cnt ?? 0,
          clients_count: clients.cnt ?? 0,
          active_users: 1,
          app_version: "1.0.0",
          platform: Capacitor.getPlatform(),
        },
      });

      if (error) {
        console.error("[Telemetry] Send failed:", error);
        return;
      }

      // Mark as sent
      const key = `${TELEMETRY_META_PREFIX}${companyId}_${today}`;
      await DataLayer.setMeta(key, "true");
      console.log("[Telemetry] Sent for", today);
    } catch (err) {
      console.error("[Telemetry] Error:", err);
    }
  },
};
