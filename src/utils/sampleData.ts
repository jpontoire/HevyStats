import type { ExerciseSession } from './exerciseStats'
import type { WeeklyVolume } from './stats'

/**
 * Hardcoded plausible data for the landing-page preview, so visitors see
 * what the app produces before importing anything. Dates are relative to
 * today so the axes always look current.
 */

function weeksAgo(count: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - count * 7)
  date.setHours(10, 0, 0, 0)
  return date
}

/** A believable 4-month bench-press e1RM progression: gains, a dip, a PR. */
const E1RM_CURVE = [58, 60, 62, 61, 64, 66, 65, 68, 70, 69, 72, 74]

export const SAMPLE_PROGRESSION: ExerciseSession[] = E1RM_CURVE.map(
  (e1rm, index) => ({
    workoutId: index + 1,
    date: weeksAgo(E1RM_CURVE.length - 1 - index),
    setCount: 4,
    volumeKg: Math.round(e1rm * 22),
    topSet: null,
    bestE1rm: e1rm,
  }),
)

const WEEKLY_VOLUMES = [
  9800, 11200, 12400, 8100, 12900, 13600, 10400, 14200, 15100, 11800, 15600,
  16400,
]

export const SAMPLE_WEEKLY_VOLUME: WeeklyVolume[] = WEEKLY_VOLUMES.map(
  (volumeKg, index) => ({
    weekStart: weeksAgo(WEEKLY_VOLUMES.length - 1 - index),
    volumeKg,
  }),
)
