/**
 * DataLayer — generic CRUD abstraction over local SQLite.
 * All service-layer code should use this instead of Supabase directly
 * for offline-first tables.
 */
import { getDB } from "./connection";

// Generates a UUID v4
function uuid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export interface QueryResult<T = Record<string, unknown>> {
  data: T[];
  error: string | null;
}

export interface SingleResult<T = Record<string, unknown>> {
  data: T | null;
  error: string | null;
}

/**
 * Generic local CRUD operations.
 */
export const DataLayer = {
  /**
   * SELECT rows from a table.
   */
  async select<T = Record<string, unknown>>(
    table: string,
    options?: {
      where?: Record<string, unknown>;
      orderBy?: string;
      limit?: number;
    }
  ): Promise<QueryResult<T>> {
    try {
      const db = await getDB();
      let sql = `SELECT * FROM ${table}`;
      const values: unknown[] = [];

      if (options?.where && Object.keys(options.where).length > 0) {
        const clauses = Object.entries(options.where).map(([key, val], i) => {
          values.push(val);
          return `${key} = ?`;
        });
        sql += ` WHERE ${clauses.join(" AND ")}`;
      }

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }

      if (options?.limit) {
        sql += ` LIMIT ${options.limit}`;
      }

      const result = await db.query(sql, values as any[]);
      return { data: (result.values || []) as T[], error: null };
    } catch (err: any) {
      console.error(`[DataLayer] select ${table}:`, err);
      return { data: [], error: err.message };
    }
  },

  /**
   * SELECT a single row by ID.
   */
  async selectById<T = Record<string, unknown>>(
    table: string,
    id: string
  ): Promise<SingleResult<T>> {
    try {
      const db = await getDB();
      const result = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      const rows = result.values || [];
      return { data: rows.length > 0 ? (rows[0] as T) : null, error: null };
    } catch (err: any) {
      console.error(`[DataLayer] selectById ${table}:`, err);
      return { data: null, error: err.message };
    }
  },

  /**
   * INSERT a row. Auto-generates id and timestamps if missing.
   */
  async insert<T = Record<string, unknown>>(
    table: string,
    data: Record<string, unknown>
  ): Promise<SingleResult<T>> {
    try {
      const db = await getDB();
      const record = {
        id: uuid(),
        created_at: now(),
        updated_at: now(),
        ...data,
      };

      const keys = Object.keys(record);
      const placeholders = keys.map(() => "?").join(", ");
      const values = keys.map((k) => record[k]);

      const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
      await db.run(sql, values as any[]);

      // Log to sync queue
      await DataLayer.logSync(table, record.id as string, "INSERT", record);

      return { data: record as T, error: null };
    } catch (err: any) {
      console.error(`[DataLayer] insert ${table}:`, err);
      return { data: null, error: err.message };
    }
  },

  /**
   * UPDATE a row by ID.
   */
  async update(
    table: string,
    id: string,
    updates: Record<string, unknown>
  ): Promise<{ error: string | null }> {
    try {
      const db = await getDB();
      const record = { ...updates, updated_at: now() };
      const keys = Object.keys(record);
      const setClauses = keys.map((k) => `${k} = ?`).join(", ");
      const values = [...keys.map((k) => record[k]), id];

      await db.run(`UPDATE ${table} SET ${setClauses} WHERE id = ?`, values as any[]);

      await DataLayer.logSync(table, id, "UPDATE", record);

      return { error: null };
    } catch (err: any) {
      console.error(`[DataLayer] update ${table}:`, err);
      return { error: err.message };
    }
  },

  /**
   * DELETE a row by ID.
   */
  async delete(
    table: string,
    id: string
  ): Promise<{ error: string | null }> {
    try {
      const db = await getDB();
      await db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);

      await DataLayer.logSync(table, id, "DELETE", null);

      return { error: null };
    } catch (err: any) {
      console.error(`[DataLayer] delete ${table}:`, err);
      return { error: err.message };
    }
  },

  /**
   * Execute a raw SQL query.
   */
  async raw<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[]
  ): Promise<QueryResult<T>> {
    try {
      const db = await getDB();
      const result = await db.query(sql, (values || []) as any[]);
      return { data: (result.values || []) as T[], error: null };
    } catch (err: any) {
      console.error(`[DataLayer] raw:`, err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Execute a raw SQL statement (INSERT/UPDATE/DELETE).
   */
  async execute(
    sql: string,
    values?: unknown[]
  ): Promise<{ error: string | null }> {
    try {
      const db = await getDB();
      await db.run(sql, (values || []) as any[]);
      return { error: null };
    } catch (err: any) {
      console.error(`[DataLayer] execute:`, err);
      return { error: err.message };
    }
  },

  /**
   * Log a change to the sync queue for later cloud sync.
   */
  async logSync(
    tableName: string,
    recordId: string,
    operation: string,
    payload: unknown
  ): Promise<void> {
    try {
      const db = await getDB();
      await db.run(
        `INSERT INTO sync_log (table_name, record_id, operation, payload, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [tableName, recordId, operation, payload ? JSON.stringify(payload) : null, now()]
      );
    } catch (err) {
      console.error("[DataLayer] logSync error:", err);
    }
  },

  /**
   * Get pending sync items.
   */
  async getPendingSync(limit = 100) {
    return DataLayer.raw(
      `SELECT * FROM sync_log WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
  },

  /**
   * Mark sync items as synced.
   */
  async markSynced(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(",");
    await DataLayer.execute(
      `UPDATE sync_log SET status = 'synced', synced_at = ? WHERE id IN (${placeholders})`,
      [now(), ...ids]
    );
  },

  /**
   * Store/retrieve local metadata (last sync time, etc.).
   */
  async getMeta(key: string): Promise<string | null> {
    const result = await DataLayer.raw<{ value: string }>(
      `SELECT value FROM local_meta WHERE key = ?`,
      [key]
    );
    return result.data.length > 0 ? result.data[0].value : null;
  },

  async setMeta(key: string, value: string): Promise<void> {
    await DataLayer.execute(
      `INSERT INTO local_meta (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, now()]
    );
  },
};
