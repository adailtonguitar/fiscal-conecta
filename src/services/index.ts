/**
 * Service layer barrel export.
 * Import services from here: import { SaleService, StockService } from "@/services";
 */
export { SaleService } from "./SaleService";
export { StockService } from "./StockService";
export { CashSessionService } from "./CashSessionService";
export { FinancialService } from "./FinancialService";
export { AuditService } from "./AuditService";
export { FiscalEmissionService } from "./FiscalEmissionService";
export { FiscalEngine } from "./FiscalEngine";
export { SyncEngine } from "./SyncEngine";
export { hydrateCompany, needsHydration } from "./HydrationService";
export { syncConfigs, getLocalConfig, needsConfigSync } from "./ConfigSyncService";
export type * from "./types";
export type * from "./types";
