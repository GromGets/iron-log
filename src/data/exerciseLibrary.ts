import { MuscleGroup } from '@/types';

export interface SeedExercise {
  name: string;
  muscleGroup: MuscleGroup;
}

// Built-in exercises. Seeded into the DB on first launch; user can add more.
export const BUILT_IN_EXERCISES: SeedExercise[] = [
  // Chest
  { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Dumbbell Flye', muscleGroup: 'Chest' },
  { name: 'Push-Up', muscleGroup: 'Chest' },
  { name: 'Cable Crossover', muscleGroup: 'Chest' },
  { name: 'Dip', muscleGroup: 'Chest' },

  // Back
  { name: 'Deadlift', muscleGroup: 'Back' },
  { name: 'Pull-Up', muscleGroup: 'Back' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Seated Cable Row', muscleGroup: 'Back' },
  { name: 'T-Bar Row', muscleGroup: 'Back' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Face Pull', muscleGroup: 'Shoulders' },
  { name: 'Rear Delt Flye', muscleGroup: 'Shoulders' },

  // Biceps
  { name: 'Barbell Curl', muscleGroup: 'Biceps' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Hammer Curl', muscleGroup: 'Biceps' },
  { name: 'Preacher Curl', muscleGroup: 'Biceps' },

  // Triceps
  { name: 'Close-Grip Bench Press', muscleGroup: 'Triceps' },
  { name: 'Tricep Pushdown', muscleGroup: 'Triceps' },
  { name: 'Skull Crusher', muscleGroup: 'Triceps' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'Triceps' },

  // Legs
  { name: 'Barbell Back Squat', muscleGroup: 'Legs' },
  { name: 'Front Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Romanian Deadlift', muscleGroup: 'Legs' },
  { name: 'Leg Extension', muscleGroup: 'Legs' },
  { name: 'Leg Curl', muscleGroup: 'Legs' },
  { name: 'Walking Lunge', muscleGroup: 'Legs' },
  { name: 'Calf Raise', muscleGroup: 'Legs' },

  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'Glutes' },
  { name: 'Glute Bridge', muscleGroup: 'Glutes' },
  { name: 'Cable Kickback', muscleGroup: 'Glutes' },

  // Core
  { name: 'Plank', muscleGroup: 'Core' },
  { name: 'Hanging Leg Raise', muscleGroup: 'Core' },
  { name: 'Cable Crunch', muscleGroup: 'Core' },
  { name: 'Russian Twist', muscleGroup: 'Core' },

  // Full body
  { name: 'Clean and Jerk', muscleGroup: 'Full Body' },
  { name: 'Kettlebell Swing', muscleGroup: 'Full Body' },
  { name: 'Burpee', muscleGroup: 'Full Body' },
];
