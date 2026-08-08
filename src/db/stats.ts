import { getDb } from './database';
import { SetEntry } from '@/types';

export interface ExerciseSetSummary {
  id: string;
  weight: number;
  reps: number;
  rir?: number | null;
}

export interface ExercisePoint {
  date: string; // session startedAt
  maxWeight: number;
  bestSetVolume: number; // weight * reps for the best single set that day
  totalVolume: number; // sum weight*reps across all sets that day
  estOneRepMax: number;
  topReps: number;
  firstSetWeight: number; // weight of the first set logged that day, chronologically
  sets: ExerciseSetSummary[]; // all sets that day, in the order they were logged
}

// Epley formula: 1RM = weight * (1 + reps/30)
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export async function getExerciseHistory(exerciseId: string): Promise<ExercisePoint[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT sess.startedAt as date, s.id as id, s.weight as weight, s.reps as reps, s.rir as rir
     FROM sets s
     JOIN sessions sess ON sess.id = s.sessionId
     WHERE s.exerciseId = ?
     ORDER BY sess.startedAt ASC, s.createdAt ASC`,
    [exerciseId]
  );

  const byDate = new Map<string, ExerciseSetSummary[]>();
  for (const r of rows) {
    const dayKey = r.date.slice(0, 10); // group by day
    if (!byDate.has(dayKey)) byDate.set(dayKey, []);
    byDate.get(dayKey)!.push({ id: r.id, weight: r.weight, reps: r.reps, rir: r.rir });
  }

  const points: ExercisePoint[] = [];
  for (const [date, sets] of byDate.entries()) {
    const maxWeight = Math.max(...sets.map((s) => s.weight));
    const totalVolume = sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
    let bestSetVolume = 0;
    let estOneRepMax = 0;
    let topReps = 0;
    for (const s of sets) {
      const vol = s.weight * s.reps;
      if (vol > bestSetVolume) bestSetVolume = vol;
      const orm = estimate1RM(s.weight, s.reps);
      if (orm > estOneRepMax) estOneRepMax = orm;
      if (s.reps > topReps) topReps = s.reps;
    }
    points.push({
      date,
      maxWeight,
      bestSetVolume,
      totalVolume,
      estOneRepMax,
      topReps,
      firstSetWeight: sets[0].weight,
      sets,
    });
  }

  return points;
}

export interface PersonalRecords {
  maxWeight: { value: number; date: string } | null;
  maxReps: { value: number; date: string } | null;
  bestEstOneRepMax: { value: number; date: string } | null;
  bestSessionVolume: { value: number; date: string } | null;
}

export async function getPersonalRecords(exerciseId: string): Promise<PersonalRecords> {
  const history = await getExerciseHistory(exerciseId);
  if (history.length === 0) {
    return { maxWeight: null, maxReps: null, bestEstOneRepMax: null, bestSessionVolume: null };
  }

  let maxWeight = history[0];
  let maxReps = history[0];
  let bestOrm = history[0];
  let bestVol = history[0];

  for (const p of history) {
    if (p.maxWeight > maxWeight.maxWeight) maxWeight = p;
    if (p.topReps > maxReps.topReps) maxReps = p;
    if (p.estOneRepMax > bestOrm.estOneRepMax) bestOrm = p;
    if (p.totalVolume > bestVol.totalVolume) bestVol = p;
  }

  return {
    maxWeight: { value: maxWeight.maxWeight, date: maxWeight.date },
    maxReps: { value: maxReps.topReps, date: maxReps.date },
    bestEstOneRepMax: { value: Math.round(bestOrm.estOneRepMax * 10) / 10, date: bestOrm.date },
    bestSessionVolume: { value: bestVol.totalVolume, date: bestVol.date },
  };
}

// Weekly total volume across ALL exercises, optionally filtered by muscle group.
export interface WeeklyVolume {
  weekStart: string; // ISO date, Monday
  totalVolume: number;
}

export async function getWeeklyVolume(weeks = 8): Promise<WeeklyVolume[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT sess.startedAt as date, s.weight as weight, s.reps as reps
     FROM sets s
     JOIN sessions sess ON sess.id = s.sessionId
     WHERE sess.finishedAt IS NOT NULL
     ORDER BY sess.startedAt ASC`
  );

  const byWeek = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.date);
    const monday = getMonday(d);
    const key = monday.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + r.weight * r.reps);
  }

  const sortedKeys = Array.from(byWeek.keys()).sort();
  const recentKeys = sortedKeys.slice(-weeks);
  return recentKeys.map((k) => ({ weekStart: k, totalVolume: byWeek.get(k) ?? 0 }));
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Volume per muscle group for the last N days — helps spot imbalances.
export interface MuscleGroupVolume {
  muscleGroup: string;
  totalVolume: number;
  setCount: number;
}

export async function getMuscleGroupVolume(days = 30): Promise<MuscleGroupVolume[]> {
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await db.getAllAsync<any>(
    `SELECT e.muscleGroup as muscleGroup, s.weight as weight, s.reps as reps
     FROM sets s
     JOIN sessions sess ON sess.id = s.sessionId
     JOIN exercises e ON e.id = s.exerciseId
     WHERE sess.startedAt >= ?`,
    [since.toISOString()]
  );

  const byGroup = new Map<string, { vol: number; count: number }>();
  for (const r of rows) {
    const cur = byGroup.get(r.muscleGroup) ?? { vol: 0, count: 0 };
    cur.vol += r.weight * r.reps;
    cur.count += 1;
    byGroup.set(r.muscleGroup, cur);
  }

  return Array.from(byGroup.entries())
    .map(([muscleGroup, v]) => ({ muscleGroup, totalVolume: v.vol, setCount: v.count }))
    .sort((a, b) => b.totalVolume - a.totalVolume);
}

// Workout streak & frequency
export interface StreakInfo {
  currentStreakDays: number;
  workoutsLast7Days: number;
  workoutsLast30Days: number;
  totalWorkouts: number;
}

export async function getStreakInfo(): Promise<StreakInfo> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ startedAt: string }>(
    'SELECT startedAt FROM sessions WHERE finishedAt IS NOT NULL ORDER BY startedAt DESC'
  );

  const dayKeys = Array.from(new Set(rows.map((r) => r.startedAt.slice(0, 10)))).sort().reverse();

  let currentStreakDays = 0;
  if (dayKeys.length > 0) {
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const key of dayKeys) {
      const keyDate = new Date(key + 'T00:00:00');
      const diffDays = Math.round((cursor.getTime() - keyDate.getTime()) / 86400000);
      if (diffDays === 0 || diffDays === 1) {
        currentStreakDays += 1;
        cursor = keyDate;
      } else {
        break;
      }
    }
  }

  const now = Date.now();
  const workoutsLast7Days = rows.filter(
    (r) => now - new Date(r.startedAt).getTime() <= 7 * 86400000
  ).length;
  const workoutsLast30Days = rows.filter(
    (r) => now - new Date(r.startedAt).getTime() <= 30 * 86400000
  ).length;

  return {
    currentStreakDays,
    workoutsLast7Days,
    workoutsLast30Days,
    totalWorkouts: rows.length,
  };
}
