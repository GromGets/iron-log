import * as SQLite from 'expo-sqlite';
import { migrate, SqlDb } from './migrate';

export { seedMeasurementTypesForStudent } from './migrate';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('iron_log.db');
  // expo-sqlite's own types require `params` where SqlDb allows it to be
  // omitted for parameterless queries — both accept a missing/empty array
  // at runtime, this is only a structural-typing strictness mismatch.
  await migrate(dbInstance as unknown as SqlDb);
  return dbInstance;
}
