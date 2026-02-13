/**
 * useSyncEngine — hook that orchestrates the SyncEngine.
 * Replaces the old useSync for the local-first architecture.
 * Auto-syncs when online, provides manual trigger and stats.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { SyncEngine, type SyncStats } from "@/services/SyncEngine";
import { TelemetryService } from "@/services/TelemetryService";
import { useCompany } from "./useCompany";
import { toast } from "sonner";

const SYNC_INTERVAL_MS = 30_000; // 30s when online
const DAILY_SUMMARY_HOUR = 23; // push daily summary at 11pm local
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1h

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState<SyncStats>({
    pending: 0,
    synced: 0,
    failed: 0,
    lastSyncAt: null,
  });
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);
  const { companyId } = useCompany();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restaurada! Sincronizando...");
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sem conexão. Dados salvos localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshStats();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const s = await SyncEngine.getStats();
      setStats(s);
    } catch {
      // DB might not be initialized yet
    }
  }, []);

  /** Push all pending changes to cloud */
  const syncNow = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const result = await SyncEngine.pushPending();

      if (result.synced > 0) {
        toast.success(`${result.synced} registro(s) sincronizado(s)`);
      }
      if (result.failed > 0) {
        console.warn(`[SyncEngine] ${result.failed} falha(s) na sincronização`);
      }

      await refreshStats();
    } catch (err) {
      console.error("[SyncEngine] Sync error:", err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [refreshStats]);

  /** Push daily summary */
  const pushDailySummary = useCallback(async () => {
    if (!companyId || !navigator.onLine) return;
    try {
      await SyncEngine.pushDailySummary(companyId);
      toast.success("Resumo diário enviado");
    } catch (err) {
      console.error("[SyncEngine] Daily summary error:", err);
    }
  }, [companyId]);

  /** Retry failed entries */
  const retryFailed = useCallback(async () => {
    const count = await SyncEngine.retryFailed();
    if (count > 0) {
      toast.info(`${count} registro(s) marcados para nova tentativa`);
      syncNow();
    }
    await refreshStats();
  }, [syncNow, refreshStats]);

  // Auto-sync interval
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(async () => {
      await refreshStats();
      const s = await SyncEngine.getStats();
      if (s.pending > 0) syncNow();

      // Check if it's time for daily summary + telemetry
      const hour = new Date().getHours();
      if (hour >= 21 && companyId) {
        const today = new Date().toISOString().slice(0, 10);
        const { DataLayer } = await import("@/lib/local-db");
        const alreadySent = await DataLayer.getMeta(`daily_summary_${today}`);
        if (!alreadySent) {
          pushDailySummary();
        }
        // Send telemetry
        TelemetryService.sendDailyTelemetry(companyId).catch(console.error);
      }
    }, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isOnline, syncNow, refreshStats, companyId, pushDailySummary]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      SyncEngine.cleanup().catch(console.error);
    }, CLEANUP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    stats,
    syncing,
    syncNow,
    pushDailySummary,
    retryFailed,
    refreshStats,
    pendingCount: stats.pending + stats.failed,
  };
}
