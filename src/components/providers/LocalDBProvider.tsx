/**
 * LocalDBProvider — initializes the local SQLite database on app startup.
 * Triggers hydration and config sync when user is authenticated.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { initLocalDB } from "@/lib/local-db";
import { needsHydration, hydrateCompany, type HydrationProgress } from "@/services/HydrationService";
import { needsConfigSync, syncConfigs } from "@/services/ConfigSyncService";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";

interface LocalDBContextType {
  ready: boolean;
  hydrating: boolean;
  hydrationProgress: HydrationProgress[];
}

const LocalDBContext = createContext<LocalDBContextType>({
  ready: false,
  hydrating: false,
  hydrationProgress: [],
});

export function LocalDBProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationProgress, setHydrationProgress] = useState<HydrationProgress[]>([]);
  const { user } = useAuth();
  const { companyId } = useCompany();

  // Initialize DB on mount
  useEffect(() => {
    initLocalDB()
      .then(() => {
        setReady(true);
        console.log("[LocalDBProvider] Database ready");
      })
      .catch((err) => {
        console.error("[LocalDBProvider] Failed to initialize DB:", err);
        // Still set ready so app works (will fall back to cloud)
        setReady(true);
      });
  }, []);

  // Hydrate + config sync when user logs in with a company
  useEffect(() => {
    if (!ready || !user || !companyId) return;

    const run = async () => {
      try {
        // Check if we need initial data hydration
        const needsData = await needsHydration(companyId);
        if (needsData && navigator.onLine) {
          setHydrating(true);
          toast.info("Sincronizando dados para uso offline...");

          await hydrateCompany(companyId, (progress) => {
            setHydrationProgress([...progress]);
          });

          toast.success("Dados sincronizados com sucesso!");
          setHydrating(false);
        }

        // Sync configs if needed (and online)
        if (navigator.onLine) {
          const needsConf = await needsConfigSync(companyId);
          if (needsConf) {
            await syncConfigs(companyId);
          }
        }
      } catch (err) {
        console.error("[LocalDBProvider] Sync error:", err);
        setHydrating(false);
      }
    };

    run();
  }, [ready, user, companyId]);

  return (
    <LocalDBContext.Provider value={{ ready, hydrating, hydrationProgress }}>
      {children}
    </LocalDBContext.Provider>
  );
}

export const useLocalDB = () => useContext(LocalDBContext);
