import { BUILT_IN_EXERCISES } from '@/data/exerciseLibrary';

// A structural interface, not expo-sqlite's own type — this file is shared
// between the native (expo-sqlite) and web (sql.js) storage backends, and
// only needs the handful of methods they both implement the same way.
export interface SqlDb {
  execAsync(sql: string): Promise<any>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  runAsync(sql: string, params?: any[]): Promise<any>;
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
}

export async function migrate(db: SqlDb) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscleGroup TEXT NOT NULL,
      isCustom INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      studentId TEXT NOT NULL DEFAULT 'default'
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
      finishedAt TEXT,
      studentId TEXT NOT NULL DEFAULT 'default'
    );

    -- Sets don't carry their own studentId: they're always reached through a
    -- session, and sessions are already scoped to a student. Any new query
    -- against this table must join sessions rather than reading it alone.
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
      weightKg REAL NOT NULL,
      studentId TEXT NOT NULL DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      valueCm REAL NOT NULL,
      studentId TEXT NOT NULL DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS measurement_types (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      studentId TEXT NOT NULL DEFAULT 'default',
      UNIQUE(name, studentId)
    );

    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exerciseId);
    CREATE INDEX IF NOT EXISTS idx_sets_session ON sets(sessionId);
    CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routineId);
  `);

  // Installs from before multi-student support need these columns added
  // (and measurement_types rebuilt, since its UNIQUE constraint changed
  // shape). CREATE TABLE IF NOT EXISTS above is a no-op on tables that
  // already exist, so this is what actually upgrades them.
  await ensureStudentColumn(db, 'routines');
  await ensureStudentColumn(db, 'sessions');
  await ensureStudentColumn(db, 'body_weight');
  await ensureStudentColumn(db, 'body_measurements');
  await ensureMeasurementTypesSchema(db);
  await ensureDefaultStudent(db);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  if (!row || row.count === 0) {
    await seedExercises(db);
  }

  const typeRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM measurement_types WHERE studentId = 'default'"
  );
  if (!typeRow || typeRow.count === 0) {
    await seedMeasurementTypesForStudent(db, 'default');
  }
}

async function ensureStudentColumn(db: SqlDb, table: string) {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === 'studentId')) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN studentId TEXT NOT NULL DEFAULT 'default'`);
  }
}

async function ensureMeasurementTypesSchema(db: SqlDb) {
  const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(measurement_types)');
  if (cols.some((c) => c.name === 'studentId')) return;

  await db.execAsync(`
    CREATE TABLE measurement_types_new (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      studentId TEXT NOT NULL DEFAULT 'default',
      UNIQUE(name, studentId)
    );
    INSERT INTO measurement_types_new (id, name, orderIndex, studentId)
      SELECT id, name, orderIndex, 'default' FROM measurement_types;
    DROP TABLE measurement_types;
    ALTER TABLE measurement_types_new RENAME TO measurement_types;
  `);
}

async function ensureDefaultStudent(db: SqlDb) {
  const studentCount = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM students');
  if (!studentCount || studentCount.c === 0) {
    await db.runAsync('INSERT INTO students (id, name, createdAt) VALUES (?, ?, ?)', [
      'default',
      'Me',
      new Date().toISOString(),
    ]);
  }

  const active = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'activeStudentId'"
  );
  const activeStillExists = active
    ? await db.getFirstAsync<{ id: string }>('SELECT id FROM students WHERE id = ?', [active.value])
    : null;
  if (!active || !activeStillExists) {
    const first = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM students ORDER BY createdAt ASC LIMIT 1'
    );
    if (first) {
      await db.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES ('activeStudentId', ?)", [
        first.id,
      ]);
    }
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

export async function seedMeasurementTypesForStudent(db: SqlDb, studentId: string) {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < DEFAULT_MEASUREMENT_TYPES.length; i++) {
      const name = DEFAULT_MEASUREMENT_TYPES[i];
      const id = `${studentId}_seed_mt_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      await db.runAsync(
        'INSERT OR IGNORE INTO measurement_types (id, name, orderIndex, studentId) VALUES (?, ?, ?, ?)',
        [id, name, i, studentId]
      );
    }
  });
}

async function seedExercises(db: SqlDb) {
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
