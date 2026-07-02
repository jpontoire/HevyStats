/** One row as it appears in Hevy's RGPD `workout_data.csv` export (one row per set). */
export interface HevyCsvRow {
  title: string
  start_time: string
  end_time: string
  description: string
  exercise_title: string
  superset_id: string
  exercise_notes: string
  set_index: string
  set_type: string
  weight_kg: string
  reps: string
  distance_km: string
  duration_seconds: string
  rpe: string
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'dropset'

/** A full training session. Rows sharing the same (title, start_time) belong to one workout. */
export interface Workout {
  id: number
  title: string
  startTime: Date
  endTime: Date
  description: string
}

/** One exercise performed within a workout (e.g. "Développé Couché (Haltère)"). */
export interface Exercise {
  id: number
  workoutId: number
  title: string
  supersetId: number | null
  notes: string
}

/** A single logged set for an exercise. */
export interface WorkoutSet {
  id: number
  exerciseId: number
  setIndex: number
  setType: SetType
  weightKg: number | null
  reps: number | null
  distanceKm: number | null
  durationSeconds: number | null
  rpe: number | null
}

/* Intermediate shapes produced by the CSV parser, before DB ids are assigned. */

export interface ParsedSet {
  setIndex: number
  setType: SetType
  weightKg: number | null
  reps: number | null
  distanceKm: number | null
  durationSeconds: number | null
  rpe: number | null
}

export interface ParsedExercise {
  title: string
  supersetId: number | null
  notes: string
  sets: ParsedSet[]
}

export interface ParsedWorkout {
  title: string
  startTime: Date
  endTime: Date
  description: string
  exercises: ParsedExercise[]
}
