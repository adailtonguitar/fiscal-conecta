/**
 * SQLite connection manager.
 * Handles initialization for both native (Capacitor) and web (jeep-sqlite) platforms.
 */
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { DB_NAME, DB_VERSION, SCHEMA_SQL } from "./schema";

let sqlite: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
let initialized = false;

/**
 * Initialize the SQLite connection.
 * On web, loads jeep-sqlite web component.
 * On native, uses the Capacitor plugin directly.
 */
export async function initLocalDB(): Promise<SQLiteDBConnection> {
  if (db && initialized) return db;

  sqlite = new SQLiteConnection(CapacitorSQLite);

  const platform = Capacitor.getPlatform();

  // Web platform needs jeep-sqlite web component
  if (platform === "web") {
    const jeepEl = document.querySelector("jeep-sqlite");
    if (!jeepEl) {
      const { defineCustomElements } = await import("jeep-sqlite/loader");
      await defineCustomElements(window);
      const el = document.createElement("jeep-sqlite");
      document.body.appendChild(el);
      await customElements.whenDefined("jeep-sqlite");
    }
    await sqlite.initWebStore();
  }

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);
  }

  await db.open();

  // Run schema creation
  await db.execute(SCHEMA_SQL);

  initialized = true;
  console.log(`[LocalDB] Initialized on ${platform}`);

  return db;
}

/**
 * Get the current database connection. Initializes if needed.
 */
export async function getDB(): Promise<SQLiteDBConnection> {
  if (!db || !initialized) {
    return initLocalDB();
  }
  return db;
}

/**
 * Close the database connection.
 */
export async function closeLocalDB(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    initialized = false;
  }
}
