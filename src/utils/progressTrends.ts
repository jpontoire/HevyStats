import type { ExerciseStats } from './exerciseStats'

export interface ExerciseTrend {
  title: string
  /** Best e1RM (kg, rounded) over the recent window. */
  recentBest: number
  /** Best e1RM over the baseline window before it. */
  previousBest: number
  deltaKg: number
  direction: 'up' | 'flat' | 'down'
}

const RECENT_DAYS = 30
const BASELINE_DAYS = 90
/** Below this relative change the lift is called flat. */
const FLAT_THRESHOLD = 0.025

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Plateau detector: for each weighted exercise, compare the best e1RM of
 * the last 30 days against the best of the 90 days before. Exercises
 * without e1RM data in both windows are skipped (no trend to report).
 * Sorted by biggest movement first.
 */
export function computeTrends(
  stats: ExerciseStats[],
  now = new Date(),
): ExerciseTrend[] {
  const recentStart = now.getTime() - RECENT_DAYS * DAY_MS
  const baselineStart = recentStart - BASELINE_DAYS * DAY_MS

  const trends: ExerciseTrend[] = []

  for (const exercise of stats) {
    let recentBest = 0
    let previousBest = 0
    for (const session of exercise.sessions) {
      if (session.bestE1rm === null) continue
      const time = session.date.getTime()
      if (time >= recentStart) {
        recentBest = Math.max(recentBest, session.bestE1rm)
      } else if (time >= baselineStart) {
        previousBest = Math.max(previousBest, session.bestE1rm)
      }
    }
    if (recentBest === 0 || previousBest === 0) continue

    const deltaKg = Math.round(recentBest) - Math.round(previousBest)
    const relative = (recentBest - previousBest) / previousBest
    trends.push({
      title: exercise.title,
      recentBest: Math.round(recentBest),
      previousBest: Math.round(previousBest),
      deltaKg,
      direction:
        Math.abs(relative) < FLAT_THRESHOLD
          ? 'flat'
          : relative > 0
            ? 'up'
            : 'down',
    })
  }

  return trends.sort((a, b) => Math.abs(b.deltaKg) - Math.abs(a.deltaKg))
}
