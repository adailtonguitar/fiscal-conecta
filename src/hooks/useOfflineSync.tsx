import { useState, useEffect, useCallback } from "react";
import { getPendingSales, markSaleSynced, getPendingCount } from "@/lib/offline-queue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restaurada! Sincronizando...");
      syncPending();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sem conexão. Vendas serão salvas localmente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending on mount
    getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncPending = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);

    try {
      const pending = await getPendingSales();
      if (pending.length === 0) {
        setSyncing(false);
        return;
      }

      let synced = 0;
      for (const sale of pending) {
        try {
          // Create fiscal document for the sale
          const { error } = await supabase.from("fiscal_documents").insert({
            company_id: sale.company_id,
            doc_type: "nfce",
            total_value: sale.total,
            payment_method: sale.payment_method,
            items_json: sale.items,
            status: "pendente",
            created_at: sale.created_at,
          });

          if (!error) {
            await markSaleSynced(sale.id);
            synced++;
          }
        } catch (err) {
          console.error("Sync error for sale:", sale.id, err);
        }
      }

      if (synced > 0) {
        toast.success(`${synced} venda(s) sincronizada(s)`);
      }

      const remaining = await getPendingCount();
      setPendingCount(remaining);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      getPendingCount().then((count) => {
        setPendingCount(count);
        if (count > 0) syncPending();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, syncPending]);

  return { isOnline, pendingCount, syncing, syncPending };
}
