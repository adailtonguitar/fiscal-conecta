/**
 * Local database barrel export.
 * Usage: import { DataLayer, initLocalDB } from "@/lib/local-db";
 */
export { initLocalDB, getDB, closeLocalDB } from "./connection";
export { DataLayer } from "./data-layer";
export type { QueryResult, SingleResult } from "./data-layer";
export { DB_NAME } from "./schema";
