/**
 * ConfigSyncService — pulls company settings, fiscal configs, and permissions from cloud to local SQLite.
 * Runs on login and periodically to keep local config fresh.
 */
import { supabase } from "@/integrations/supabase/client";
import { DataLayer, getDB, initLocalDB } from "@/lib/local-db";

/**
 * Sync company profile from cloud to local_meta.
 */
async function syncCompanyProfile(companyId: string): Promise<void> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    console.warn("[ConfigSync] Failed to fetch company profile:", error?.message);
    return;
  }

  await DataLayer.setMeta(`company_profile_${companyId}`, JSON.stringify(data));
}

/**
 * Sync fiscal configs from cloud to local_meta.
 */
async function syncFiscalConfigs(companyId: string): Promise<void> {
  const { data, error } = await supabase
    .from("fiscal_configs")
    .select("*")
    .eq("company_id", companyId);

  if (error) {
    console.warn("[ConfigSync] Failed to fetch fiscal configs:", error.message);
    return;
  }

  await DataLayer.setMeta(`fiscal_configs_${companyId}`, JSON.stringify(data || []));
}

/**
 * Sync fiscal categories from cloud to local_meta.
 */
async function syncFiscalCategories(companyId: string): Promise<void> {
  const { data, error } = await supabase
    .from("fiscal_categories")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);

  if (error) {
    console.warn("[ConfigSync] Failed to fetch fiscal categories:", error.message);
    return;
  }

  await DataLayer.setMeta(`fiscal_categories_${companyId}`, JSON.stringify(data || []));
}

/**
 * Sync permissions table (global, not company-scoped).
 */
async function syncPermissions(): Promise<void> {
  const { data, error } = await supabase
    .from("permissions")
    .select("*");

  if (error) {
    console.warn("[ConfigSync] Failed to fetch permissions:", error.message);
    return;
  }

  await DataLayer.setMeta("permissions", JSON.stringify(data || []));
}

/**
 * Sync loyalty config from cloud.
 */
async function syncLoyaltyConfig(companyId: string): Promise<void> {
  const { data, error } = await supabase
    .from("loyalty_config")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.warn("[ConfigSync] Failed to fetch loyalty config:", error.message);
    return;
  }

  await DataLayer.setMeta(`loyalty_config_${companyId}`, JSON.stringify(data));
}

/**
 * Sync discount limits (global).
 */
async function syncDiscountLimits(): Promise<void> {
  const { data, error } = await supabase
    .from("discount_limits")
    .select("*");

  if (error) {
    console.warn("[ConfigSync] Failed to fetch discount limits:", error.message);
    return;
  }

  await DataLayer.setMeta("discount_limits", JSON.stringify(data || []));
}

/**
 * Run full config sync for a company.
 */
export async function syncConfigs(companyId: string): Promise<void> {
  await initLocalDB();

  console.log("[ConfigSync] Starting config sync for company:", companyId);

  await Promise.allSettled([
    syncCompanyProfile(companyId),
    syncFiscalConfigs(companyId),
    syncFiscalCategories(companyId),
    syncPermissions(),
    syncLoyaltyConfig(companyId),
    syncDiscountLimits(),
  ]);

  await DataLayer.setMeta(`last_config_sync_${companyId}`, new Date().toISOString());
  console.log("[ConfigSync] Config sync complete");
}

/**
 * Get a cached config from local_meta.
 */
export async function getLocalConfig<T = unknown>(key: string): Promise<T | null> {
  try {
    const raw = await DataLayer.getMeta(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Check if config sync is needed (older than 1 hour).
 */
export async function needsConfigSync(companyId: string): Promise<boolean> {
  try {
    await initLocalDB();
    const lastSync = await DataLayer.getMeta(`last_config_sync_${companyId}`);
    if (!lastSync) return true;
    const elapsed = Date.now() - new Date(lastSync).getTime();
    return elapsed > 60 * 60 * 1000; // 1 hour
  } catch {
    return true;
  }
}
