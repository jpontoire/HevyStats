import { db } from './db'
import { importWorkouts, type ImportSummary } from './importWorkouts'
import type {
  Exercise,
  ParsedWorkout,
  Workout,
  WorkoutSet,
} from '../types/hevy'

/**
 * Full JSON dump of the local database, for backup or moving to another
 * browser. Dates are serialized as ISO strings by JSON.stringify.
 */
export async function exportBackup(): Promise<Blob> {
  const [workouts, exercises, sets] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.sets.toArray(),
  ])
  const payload = {
    app: 'HevyStats',
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts,
    exercises,
    sets,
  }
  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

/** Workout/exercise rows as they appear in the JSON file: dates are ISO strings. */
type SerializedWorkout = Omit<Workout, 'startTime' | 'endTime'> & {
  startTime: string
  endTime: string
}

interface BackupPayload {
  app: string
  version: number
  workouts: SerializedWorkout[]
  exercises: Exercise[]
  sets: WorkoutSet[]
}

function isBackupPayload(value: unknown): value is BackupPayload {
  const payload = value as Partial<BackupPayload> | null
  return (
    payload?.app === 'HevyStats' &&
    Array.isArray(payload.workouts) &&
    Array.isArray(payload.exercises) &&
    Array.isArray(payload.sets)
  )
}

/**
 * Restore a backup produced by exportBackup. Reuses the same per-workout
 * deduplication as the CSV import, so restoring on top of existing data
 * never duplicates workouts.
 */
export async function importBackup(text: string): Promise<ImportSummary> {
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  if (!isBackupPayload(payload)) {
    throw new Error('This file does not look like a HevyStats backup.')
  }

  const exercisesByWorkout = new Map<number, Exercise[]>()
  for (const exercise of payload.exercises) {
    const list = exercisesByWorkout.get(exercise.workoutId) ?? []
    list.push(exercise)
    exercisesByWorkout.set(exercise.workoutId, list)
  }
  const setsByExercise = new Map<number, WorkoutSet[]>()
  for (const set of payload.sets) {
    const list = setsByExercise.get(set.exerciseId) ?? []
    list.push(set)
    setsByExercise.set(set.exerciseId, list)
  }

  const parsed: ParsedWorkout[] = []
  for (const workout of payload.workouts) {
    const startTime = new Date(workout.startTime)
    const endTime = new Date(workout.endTime)
    if (Number.isNaN(startTime.getTime())) continue

    const exercises = (exercisesByWorkout.get(workout.id) ?? []).map(
      (exercise) => ({
        title: exercise.title,
        supersetId: exercise.supersetId ?? null,
        notes: exercise.notes ?? '',
        sets: (setsByExercise.get(exercise.id) ?? [])
          .sort((a, b) => a.setIndex - b.setIndex)
          .map((set) => ({
            setIndex: set.setIndex,
            setType: set.setType,
            weightKg: set.weightKg ?? null,
            reps: set.reps ?? null,
            distanceKm: set.distanceKm ?? null,
            durationSeconds: set.durationSeconds ?? null,
            rpe: set.rpe ?? null,
          })),
      }),
    )

    parsed.push({
      title: workout.title,
      startTime,
      endTime: Number.isNaN(endTime.getTime()) ? startTime : endTime,
      description: workout.description ?? '',
      exercises,
    })
  }

  return importWorkouts(parsed)
}

/** Wipe every table. Irreversible — callers must confirm with the user first. */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.workouts, db.exercises, db.sets, async () => {
    await Promise.all([
      db.workouts.clear(),
      db.exercises.clear(),
      db.sets.clear(),
    ])
  })
}
