import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { migrate, SqlDb } from './migrate';

export { seedMeasurementTypesForStudent } from './migrate';

// expo-sqlite has no web target (SDK 51), so on web this app runs on
// sql.js — real SQLite compiled to WebAssembly — with the whole database
// persisted as a single blob in IndexedDB. Every write re-exports and
// re-saves that blob; for a personal/small-team dataset like this one,
// that's cheap enough not to bother with anything fancier.
const IDB_NAME = 'iron_log_web';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'db';
const SQL_JS_VERSION = '1.14.1';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadSavedBytes(): Promise<Uint8Array | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function saveBytes(bytes: Uint8Array): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let dbInstance: SqlDb | null = null;

export async function getDb(): Promise<SqlDb> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://unpkg.com/sql.js@${SQL_JS_VERSION}/dist/${file}`,
  });
  const saved = await loadSavedBytes();
  const sqlJsDb: SqlJsDatabase = saved ? new SQL.Database(saved) : new SQL.Database();

  const persist = () => saveBytes(sqlJsDb.export());

  dbInstance = {
    async execAsync(sql: string) {
      sqlJsDb.exec(sql);
      await persist();
    },
    async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = sqlJsDb.prepare(sql);
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      stmt.free();
      return rows;
    },
    async getFirstAsync<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const rows = await dbInstance!.getAllAsync<T>(sql, params);
      return rows[0] ?? null;
    },
    async runAsync(sql: string, params: any[] = []) {
      sqlJsDb.run(sql, params);
      await persist();
      return {};
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      await fn();
    },
  };

  await migrate(dbInstance);
  return dbInstance;
}
