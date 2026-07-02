import { db } from './db'
import type { ParsedWorkout } from '../types/hevy'

export interface ImportSummary {
  workoutsAdded: number
  /** Workouts already present (same start time and title), left untouched. */
  workoutsSkipped: number
  setsAdded: number
}

/**
 * Insert parsed workouts into IndexedDB, skipping ones that already exist so
 * re-importing a newer export never duplicates history. Runs in a single
 * transaction: either the whole import lands or nothing does.
 */
export async function importWorkouts(
  parsed: ParsedWorkout[],
): Promise<ImportSummary> {
  return db.transaction('rw', db.workouts, db.exercises, db.sets, async () => {
    const existing = new Set(
      (await db.workouts.toArray()).map(
        (w) => `${w.startTime.getTime()}|${w.title}`,
      ),
    )

    let workoutsAdded = 0
    let setsAdded = 0

    for (const workout of parsed) {
      const key = `${workout.startTime.getTime()}|${workout.title}`
      if (existing.has(key)) continue
      existing.add(key)

      const workoutId = await db.workouts.add({
        title: workout.title,
        startTime: workout.startTime,
        endTime: workout.endTime,
        description: workout.description,
      })

      for (const exercise of workout.exercises) {
        const exerciseId = await db.exercises.add({
          workoutId,
          title: exercise.title,
          supersetId: exercise.supersetId,
          notes: exercise.notes,
        })
        await db.sets.bulkAdd(
          exercise.sets.map((set) => ({ ...set, exerciseId })),
        )
        setsAdded += exercise.sets.length
      }
      workoutsAdded++
    }

    return {
      workoutsAdded,
      workoutsSkipped: parsed.length - workoutsAdded,
      setsAdded,
    }
  })
}
