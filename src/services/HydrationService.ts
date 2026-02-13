/**
 * HydrationService — downloads cloud data to local SQLite on first login.
 * Runs once per company, then only syncs deltas.
 */
import { supabase } from "@/integrations/supabase/client";
import { DataLayer, initLocalDB } from "@/lib/local-db";

const HYDRATION_KEY_PREFIX = "hydrated_";
const BATCH_SIZE = 500;

/**
 * Check if a table has been hydrated for a given company.
 */
async function isHydrated(table: string, companyId: string): Promise<boolean> {
  const key = `${HYDRATION_KEY_PREFIX}${table}_${companyId}`;
  const val = await DataLayer.getMeta(key);
  return val === "true";
}

/**
 * Mark a table as hydrated for a given company.
 */
async function markHydrated(table: string, companyId: string): Promise<void> {
  const key = `${HYDRATION_KEY_PREFIX}${table}_${companyId}`;
  await DataLayer.setMeta(key, "true");
}

/**
 * Download all rows from a Supabase table and insert into local SQLite.
 */
async function hydrateTable(
  table: string,
  companyId: string,
  options?: { booleanFields?: string[] }
): Promise<number> {
  let count = 0;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table as any)
      .select("*")
      .eq("company_id", companyId)
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      console.error(`[Hydration] Error fetching ${table}:`, error.message);
      throw new Error(`Hydration failed for ${table}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    // Insert each row into local DB
    const db = await (await import("@/lib/local-db")).getDB();
    for (const row of data) {
      const record: Record<string, unknown> = Object.assign({}, row as any);

      // Convert booleans to integers for SQLite
      if (options?.booleanFields) {
        for (const field of options.booleanFields) {
          if (field in record) {
            record[field] = record[field] ? 1 : 0;
          }
        }
      }

      // Convert objects/arrays to JSON strings
      for (const [key, val] of Object.entries(record)) {
        if (val !== null && typeof val === "object") {
          record[key] = JSON.stringify(val);
        }
      }

      const keys = Object.keys(record);
      const placeholders = keys.map(() => "?").join(", ");
      const values = keys.map((k) => record[k]);

      await db.run(
        `INSERT OR REPLACE INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`,
        values as any[]
      );
    }

    count += data.length;
    from += BATCH_SIZE;

    if (data.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return count;
}

/** Tables to hydrate with their boolean field mappings */
const HYDRATION_CONFIG: Array<{
  table: string;
  booleanFields?: string[];
}> = [
  { table: "products", booleanFields: ["is_active"] },
  { table: "clients", booleanFields: ["is_active"] },
  { table: "fiscal_documents", booleanFields: ["is_contingency"] },
  { table: "stock_movements" },
  { table: "cash_sessions" },
  { table: "cash_movements" },
  { table: "financial_entries" },
];

export interface HydrationProgress {
  table: string;
  status: "pending" | "downloading" | "done" | "error";
  count: number;
  error?: string;
}

/**
 * Run full hydration for a company.
 * Returns progress for each table.
 */
export async function hydrateCompany(
  companyId: string,
  onProgress?: (progress: HydrationProgress[]) => void
): Promise<HydrationProgress[]> {
  // Ensure local DB is initialized
  await initLocalDB();

  const progress: HydrationProgress[] = HYDRATION_CONFIG.map((c) => ({
    table: c.table,
    status: "pending" as const,
    count: 0,
  }));

  for (let i = 0; i < HYDRATION_CONFIG.length; i++) {
    const config = HYDRATION_CONFIG[i];

    // Skip if already hydrated
    const alreadyDone = await isHydrated(config.table, companyId);
    if (alreadyDone) {
      progress[i] = { table: config.table, status: "done", count: -1 };
      onProgress?.(progress);
      continue;
    }

    progress[i].status = "downloading";
    onProgress?.(progress);

    try {
      const count = await hydrateTable(config.table, companyId, {
        booleanFields: config.booleanFields,
      });
      await markHydrated(config.table, companyId);
      progress[i] = { table: config.table, status: "done", count };
    } catch (err: any) {
      progress[i] = {
        table: config.table,
        status: "error",
        count: 0,
        error: err.message,
      };
    }

    onProgress?.(progress);
  }

  // Set last hydration timestamp
  await DataLayer.setMeta(`last_hydration_${companyId}`, new Date().toISOString());

  console.log("[Hydration] Complete:", progress);
  return progress;
}

/**
 * Check if company needs hydration.
 */
export async function needsHydration(companyId: string): Promise<boolean> {
  try {
    await initLocalDB();
    for (const config of HYDRATION_CONFIG) {
      const done = await isHydrated(config.table, companyId);
      if (!done) return true;
    }
    return false;
  } catch {
    return true;
  }
}
