import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { buildWorkoutSummaries, type WorkoutSummary } from '../utils/stats'

/**
 * Live per-workout aggregates (volume, sets, duration), newest first.
 * Returns undefined while the first query is loading.
 */
export function useWorkoutSummaries(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const [workouts, exercises, sets] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.sets.toArray(),
    ])
    return buildWorkoutSummaries(workouts, exercises, sets)
  })
}
