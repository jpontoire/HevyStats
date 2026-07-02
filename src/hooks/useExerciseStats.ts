import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { buildExerciseStats, type ExerciseStats } from '../utils/exerciseStats'
import { rangeStart, type TimeRange } from '../utils/timeRange'

/**
 * Live per-exercise aggregates, optionally restricted to a time range
 * (PRs then mean "best in this period"). Undefined while loading.
 */
export function useExerciseStats(
  range: TimeRange = 'all',
): ExerciseStats[] | undefined {
  return useLiveQuery(async () => {
    const start = rangeStart(range)
    const [workouts, exercises, sets] = await Promise.all([
      start
        ? db.workouts.where('startTime').aboveOrEqual(start).toArray()
        : db.workouts.toArray(),
      db.exercises.toArray(),
      db.sets.toArray(),
    ])
    return buildExerciseStats(workouts, exercises, sets)
  }, [range])
}
