/**
 * SQLite connection manager.
 * All imports are dynamic to prevent crashes on web when WASM fails to load.
 */
import { DB_NAME, DB_VERSION, SCHEMA_SQL } from "./schema";

let sqlite: any = null;
let db: any = null;
let initialized = false;

/**
 * Initialize the SQLite connection.
 * On web, loads jeep-sqlite web component.
 * On native, uses the Capacitor plugin directly.
 */
export async function initLocalDB(): Promise<any | null> {
  if (db && initialized) return db;

  let platform = "web";
  try {
    const { Capacitor } = await import("@capacitor/core");
    platform = Capacitor.getPlatform();
  } catch {
    platform = "web";
  }

  // On web, jeep-sqlite WASM can fail or be very slow — use a timeout
  if (platform === "web") {
    try {
      const result = await Promise.race([
        initWebDB(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("SQLite web init timeout")), 5000)),
      ]);
      return result;
    } catch (err) {
      console.warn("[LocalDB] Web init failed/timed out, running without local DB:", err);
      return null;
    }
  }

  // Native platforms
  try {
    return await initNativeDB();
  } catch (err) {
    console.warn("[LocalDB] Native init failed:", err);
    return null;
  }
}

async function initWebDB(): Promise<any> {
  const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite");
  sqlite = new SQLiteConnection(CapacitorSQLite);

  const jeepEl = document.querySelector("jeep-sqlite");
  if (!jeepEl) {
    const { defineCustomElements } = await import("jeep-sqlite/loader");
    await defineCustomElements(window);
    const el = document.createElement("jeep-sqlite");
    document.body.appendChild(el);
    await customElements.whenDefined("jeep-sqlite");
  }
  await sqlite.initWebStore();

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);
  }

  await db.open();
  await db.execute(SCHEMA_SQL);

  initialized = true;
  console.log("[LocalDB] Initialized on web");
  return db;
}

async function initNativeDB(): Promise<any> {
  const { CapacitorSQLite, SQLiteConnection } = await import("@capacitor-community/sqlite");
  sqlite = new SQLiteConnection(CapacitorSQLite);

  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

  if (ret.result && isConn) {
    db = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    db = await sqlite.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);
  }

  await db.open();
  await db.execute(SCHEMA_SQL);

  initialized = true;
  console.log("[LocalDB] Initialized on native");
  return db;
}

/**
 * Get the current database connection. Initializes if needed.
 */
export async function getDB(): Promise<any | null> {
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
