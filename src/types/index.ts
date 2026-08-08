export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Full Body'
  | 'Other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  notes?: string | null;
}

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;
  targetSets?: number | null;
}

export interface WorkoutSession {
  id: string;
  routineId?: string | null;
  routineName?: string | null;
  startedAt: string;
  finishedAt?: string | null;
}

export interface SetEntry {
  id: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  weight: number;
  reps: number;
  rir?: number | null; // reps in reserve
  notes?: string | null;
  createdAt: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weightKg: number;
}

export type MeasurementType = string;

export interface MeasurementTypeDef {
  id: string;
  name: string;
  orderIndex: number;
}

export interface BodyMeasurementEntry {
  id: string;
  date: string;
  type: MeasurementType;
  valueCm: number;
}
