import * as SQLite from 'expo-sqlite';
import { BUILT_IN_EXERCISES } from '@/data/exerciseLibrary';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('iron_log.db');
  await migrate(dbInstance);
  return dbInstance;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscleGroup TEXT NOT NULL,
      isCustom INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      routineId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      targetSets INTEGER,
      FOREIGN KEY (routineId) REFERENCES routines(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      routineId TEXT,
      routineName TEXT,
      startedAt TEXT NOT NULL,
      finishedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      sessionId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      setIndex INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      rir INTEGER,
      notes TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (exerciseId) REFERENCES exercises(id)
    );

    CREATE TABLE IF NOT EXISTS body_weight (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      weightKg REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      valueCm REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS measurement_types (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      orderIndex INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exerciseId);
    CREATE INDEX IF NOT EXISTS idx_sets_session ON sets(sessionId);
    CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routineId);
  `);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if (!row || row.count === 0) {
    await seedExercises(db);
  }

  const typeRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM measurement_types'
  );
  if (!typeRow || typeRow.count === 0) {
    await seedMeasurementTypes(db);
  }
}

const DEFAULT_MEASUREMENT_TYPES = [
  'Waist',
  'Chest',
  'Left Arm',
  'Right Arm',
  'Left Thigh',
  'Right Thigh',
  'Hips',
  'Neck',
  'Shoulders',
];

async function seedMeasurementTypes(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < DEFAULT_MEASUREMENT_TYPES.length; i++) {
      const name = DEFAULT_MEASUREMENT_TYPES[i];
      const id = `seed_mt_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      await db.runAsync(
        'INSERT OR IGNORE INTO measurement_types (id, name, orderIndex) VALUES (?, ?, ?)',
        [id, name, i]
      );
    }
  });
}

async function seedExercises(db: SQLite.SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    for (const ex of BUILT_IN_EXERCISES) {
      const id = `seed_${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (id, name, muscleGroup, isCustom, notes) VALUES (?, ?, ?, 0, NULL)',
        [id, ex.name, ex.muscleGroup]
      );
    }
  });
}
