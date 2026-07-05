import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { buildExerciseStats } from '../utils/exerciseStats'
import { computePrEvents, type PrEvent } from '../utils/prEvents'
import { computeTrends, type ExerciseTrend } from '../utils/progressTrends'
import { rangeStart, type TimeRange } from '../utils/timeRange'

const MAX_PRS = 8
const MAX_TRENDS = 8

export interface ProgressInsights {
  /** PR events achieved within the selected range, newest first. */
  prs: PrEvent[]
  /** e1RM trends (fixed windows relative to today), biggest movers first. */
  trends: ExerciseTrend[]
}

export function useProgressInsights(
  range: TimeRange,
): ProgressInsights | undefined {
  return useLiveQuery(async () => {
    const [workouts, exercises, sets] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.sets.toArray(),
    ])

    const events = computePrEvents(workouts, exercises, sets)
    const start = rangeStart(range)
    const prs = (
      start ? events.filter((e) => e.date.getTime() >= start.getTime()) : events
    ).slice(0, MAX_PRS)

    const trends = computeTrends(
      buildExerciseStats(workouts, exercises, sets),
    ).slice(0, MAX_TRENDS)

    return { prs, trends }
  }, [range])
}
