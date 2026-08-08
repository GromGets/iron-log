import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database';
import {
  Exercise,
  MuscleGroup,
  Routine,
  RoutineExercise,
  WorkoutSession,
  SetEntry,
  BodyWeightEntry,
  BodyMeasurementEntry,
  MeasurementType,
} from '@/types';

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM exercises ORDER BY name ASC');
  return rows.map(rowToExercise);
}

export async function createCustomExercise(
  name: string,
  muscleGroup: MuscleGroup,
  notes?: string
): Promise<Exercise> {
  const db = await getDb();
  const id = uuidv4();
  await db.runAsync(
    'INSERT INTO exercises (id, name, muscleGroup, isCustom, notes) VALUES (?, ?, ?, 1, ?)',
    [id, name.trim(), muscleGroup, notes ?? null]
  );
  return { id, name: name.trim(), muscleGroup, isCustom: true, notes: notes ?? null };
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}

function rowToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscleGroup,
    isCustom: !!row.isCustom,
    notes: row.notes,
  };
}

// ---------------------------------------------------------------------------
// Routines
// ---------------------------------------------------------------------------

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM routines ORDER BY createdAt DESC');
  return rows;
}

export async function createRoutine(name: string): Promise<Routine> {
  const db = await getDb();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  await db.runAsync('INSERT INTO routines (id, name, createdAt) VALUES (?, ?, ?)', [
    id,
    name.trim(),
    createdAt,
  ]);
  return { id, name: name.trim(), createdAt };
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routine_exercises WHERE routineId = ?', [id]);
  await db.runAsync('DELETE FROM routines WHERE id = ?', [id]);
}

export async function getRoutineExercises(
  routineId: string
): Promise<(RoutineExercise & { exercise: Exercise })[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT re.*, e.name as exName, e.muscleGroup as exMuscleGroup, e.isCustom as exIsCustom, e.notes as exNotes
     FROM routine_exercises re
     JOIN exercises e ON e.id = re.exerciseId
     WHERE re.routineId = ?
     ORDER BY re.orderIndex ASC`,
    [routineId]
  );
  return rows.map((r) => ({
    id: r.id,
    routineId: r.routineId,
    exerciseId: r.exerciseId,
    orderIndex: r.orderIndex,
    targetSets: r.targetSets,
    exercise: {
      id: r.exerciseId,
      name: r.exName,
      muscleGroup: r.exMuscleGroup,
      isCustom: !!r.exIsCustom,
      notes: r.exNotes,
    },
  }));
}

export async function addExerciseToRoutine(
  routineId: string,
  exerciseId: string,
  targetSets?: number
): Promise<void> {
  const db = await getDb();
  const existing = await db.getAllAsync<any>(
    'SELECT MAX(orderIndex) as maxOrder FROM routine_exercises WHERE routineId = ?',
    [routineId]
  );
  const nextOrder = (existing[0]?.maxOrder ?? -1) + 1;
  await db.runAsync(
    'INSERT INTO routine_exercises (id, routineId, exerciseId, orderIndex, targetSets) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), routineId, exerciseId, nextOrder, targetSets ?? null]
  );
}

export async function removeExerciseFromRoutine(routineExerciseId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routine_exercises WHERE id = ?', [routineExerciseId]);
}

// ---------------------------------------------------------------------------
// Sessions & Sets
// ---------------------------------------------------------------------------

export async function startSession(
  routineId?: string,
  routineName?: string
): Promise<WorkoutSession> {
  const db = await getDb();
  const id = uuidv4();
  const startedAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sessions (id, routineId, routineName, startedAt, finishedAt) VALUES (?, ?, ?, ?, NULL)',
    [id, routineId ?? null, routineName ?? null, startedAt]
  );
  return { id, routineId, routineName, startedAt, finishedAt: null };
}

export async function finishSession(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sessions SET finishedAt = ? WHERE id = ?', [
    new Date().toISOString(),
    sessionId,
  ]);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE sessionId = ?', [sessionId]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

export async function listSessions(limit = 50): Promise<WorkoutSession[]> {
  const db = await getDb();
  return db.getAllAsync<WorkoutSession>(
    'SELECT * FROM sessions WHERE finishedAt IS NOT NULL ORDER BY startedAt DESC LIMIT ?',
    [limit]
  );
}

export async function getSessionSets(sessionId: string): Promise<SetEntry[]> {
  const db = await getDb();
  return db.getAllAsync<SetEntry>(
    'SELECT * FROM sets WHERE sessionId = ? ORDER BY exerciseId, setIndex ASC',
    [sessionId]
  );
}

export async function addSet(
  sessionId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  rir?: number | null,
  notes?: string | null
): Promise<SetEntry> {
  const db = await getDb();
  const countRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM sets WHERE sessionId = ? AND exerciseId = ?',
    [sessionId, exerciseId]
  );
  const setIndex = (countRow?.c ?? 0) + 1;
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO sets (id, sessionId, exerciseId, setIndex, weight, reps, rir, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, sessionId, exerciseId, setIndex, weight, reps, rir ?? null, notes ?? null, createdAt]
  );
  return { id, sessionId, exerciseId, setIndex, weight, reps, rir: rir ?? null, notes: notes ?? null, createdAt };
}

export async function deleteSet(setId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE id = ?', [setId]);
}

// "Last time" — most recent completed session's sets for a given exercise,
// excluding the current in-progress session.
export async function getLastTimeForExercise(
  exerciseId: string,
  excludeSessionId?: string
): Promise<{ date: string; sets: SetEntry[] } | null> {
  const db = await getDb();
  const lastSession = await db.getFirstAsync<{ sessionId: string; startedAt: string }>(
    `SELECT s.sessionId as sessionId, sess.startedAt as startedAt
     FROM sets s
     JOIN sessions sess ON sess.id = s.sessionId
     WHERE s.exerciseId = ? AND s.sessionId != ?
     ORDER BY sess.startedAt DESC
     LIMIT 1`,
    [exerciseId, excludeSessionId ?? '']
  );
  if (!lastSession) return null;
  const sets = await db.getAllAsync<SetEntry>(
    'SELECT * FROM sets WHERE sessionId = ? AND exerciseId = ? ORDER BY setIndex ASC',
    [lastSession.sessionId, exerciseId]
  );
  return { date: lastSession.startedAt, sets };
}

// ---------------------------------------------------------------------------
// Body tracking
// ---------------------------------------------------------------------------

export async function addBodyWeight(weightKg: number, date?: string): Promise<BodyWeightEntry> {
  const db = await getDb();
  const id = uuidv4();
  const d = date ?? new Date().toISOString();
  await db.runAsync('INSERT INTO body_weight (id, date, weightKg) VALUES (?, ?, ?)', [
    id,
    d,
    weightKg,
  ]);
  return { id, date: d, weightKg };
}

export async function listBodyWeights(limit = 200): Promise<BodyWeightEntry[]> {
  const db = await getDb();
  return db.getAllAsync<BodyWeightEntry>(
    'SELECT * FROM body_weight ORDER BY date DESC LIMIT ?',
    [limit]
  );
}

export async function deleteBodyWeight(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM body_weight WHERE id = ?', [id]);
}

export async function addBodyMeasurement(
  type: MeasurementType,
  valueCm: number,
  date?: string
): Promise<BodyMeasurementEntry> {
  const db = await getDb();
  const id = uuidv4();
  const d = date ?? new Date().toISOString();
  await db.runAsync(
    'INSERT INTO body_measurements (id, date, type, valueCm) VALUES (?, ?, ?, ?)',
    [id, d, type, valueCm]
  );
  return { id, date: d, type, valueCm };
}

export async function listBodyMeasurements(
  type?: MeasurementType,
  limit = 200
): Promise<BodyMeasurementEntry[]> {
  const db = await getDb();
  if (type) {
    return db.getAllAsync<BodyMeasurementEntry>(
      'SELECT * FROM body_measurements WHERE type = ? ORDER BY date DESC LIMIT ?',
      [type, limit]
    );
  }
  return db.getAllAsync<BodyMeasurementEntry>(
    'SELECT * FROM body_measurements ORDER BY date DESC LIMIT ?',
    [limit]
  );
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
}
