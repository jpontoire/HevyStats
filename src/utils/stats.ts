import type { Exercise, Workout, WorkoutSet } from '../types/hevy'

export interface WorkoutSummary {
  workout: Workout
  exerciseCount: number
  setCount: number
  volumeKg: number
  durationMinutes: number
}

/** Tonnage of one set. Warmups don't count toward training volume. */
export function setVolumeKg(set: WorkoutSet): number {
  if (set.setType === 'warmup') return 0
  return (set.weightKg ?? 0) * (set.reps ?? 0)
}

/**
 * Epley one-rep-max estimate. Only meaningful for low-rep sets;
 * returns null past 12 reps where the formula stops being credible.
 */
export function estimateOneRepMax(
  weightKg: number,
  reps: number,
): number | null {
  if (weightKg <= 0 || reps <= 0 || reps > 12) return null
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

/** Join the three tables into per-workout aggregates, newest first. */
export function buildWorkoutSummaries(
  workouts: Workout[],
  exercises: Exercise[],
  sets: WorkoutSet[],
): WorkoutSummary[] {
  const workoutIdByExercise = new Map<number, number>()
  const exerciseCounts = new Map<number, number>()
  for (const exercise of exercises) {
    workoutIdByExercise.set(exercise.id, exercise.workoutId)
    exerciseCounts.set(
      exercise.workoutId,
      (exerciseCounts.get(exercise.workoutId) ?? 0) + 1,
    )
  }

  const setCounts = new Map<number, number>()
  const volumes = new Map<number, number>()
  for (const set of sets) {
    const workoutId = workoutIdByExercise.get(set.exerciseId)
    if (workoutId === undefined) continue
    setCounts.set(workoutId, (setCounts.get(workoutId) ?? 0) + 1)
    volumes.set(workoutId, (volumes.get(workoutId) ?? 0) + setVolumeKg(set))
  }

  return workouts
    .map((workout) => ({
      workout,
      exerciseCount: exerciseCounts.get(workout.id) ?? 0,
      setCount: setCounts.get(workout.id) ?? 0,
      volumeKg: volumes.get(workout.id) ?? 0,
      durationMinutes: Math.max(
        0,
        Math.round(
          (workout.endTime.getTime() - workout.startTime.getTime()) / 60_000,
        ),
      ),
    }))
    .sort((a, b) => b.workout.startTime.getTime() - a.workout.startTime.getTime())
}

export interface WeeklyVolume {
  /** Local midnight of the week's Monday. */
  weekStart: Date
  volumeKg: number
}

/** Monday (local midnight) of the week containing the given date. */
function weekStartDate(date: Date): Date {
  const mondayOffset = (date.getDay() + 6) % 7
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - mondayOffset,
  )
}

/**
 * Total volume per calendar week, oldest first. Weeks without any workout
 * are filled with 0 so a time axis over the result is honest.
 */
export function weeklyVolumes(summaries: WorkoutSummary[]): WeeklyVolume[] {
  if (summaries.length === 0) return []

  const byWeek = new Map<number, number>()
  for (const summary of summaries) {
    const key = weekStartDate(summary.workout.startTime).getTime()
    byWeek.set(key, (byWeek.get(key) ?? 0) + summary.volumeKg)
  }

  const keys = [...byWeek.keys()].sort((a, b) => a - b)
  const result: WeeklyVolume[] = []
  let cursor = new Date(keys[0]!)
  const last = keys[keys.length - 1]!
  while (cursor.getTime() <= last) {
    result.push({
      weekStart: cursor,
      volumeKg: byWeek.get(cursor.getTime()) ?? 0,
    })
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 7,
    )
  }
  return result
}

export interface GlobalStats {
  totalWorkouts: number
  totalVolumeKg: number
  avgPerWeek: number
  longestWeekStreak: number
  firstDate: Date
  lastDate: Date
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Monday-based week index of a local calendar date, DST-proof via UTC math. */
function weekIndex(date: Date): number {
  const mondayOffset = (date.getDay() + 6) % 7
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset) /
      WEEK_MS,
  )
}

/** Expects summaries sorted newest first (as built by buildWorkoutSummaries). */
export function computeGlobalStats(
  summaries: WorkoutSummary[],
): GlobalStats | null {
  const newest = summaries[0]
  const oldest = summaries[summaries.length - 1]
  if (!newest || !oldest) return null

  const weeks = [
    ...new Set(summaries.map((s) => weekIndex(s.workout.startTime))),
  ].sort((a, b) => a - b)

  let longestWeekStreak = 1
  let current = 1
  for (let i = 1; i < weeks.length; i++) {
    current = weeks[i] === weeks[i - 1]! + 1 ? current + 1 : 1
    longestWeekStreak = Math.max(longestWeekStreak, current)
  }

  const lastDate = newest.workout.startTime
  const firstDate = oldest.workout.startTime
  const spanWeeks = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / WEEK_MS,
  )

  return {
    totalWorkouts: summaries.length,
    totalVolumeKg: summaries.reduce((total, s) => total + s.volumeKg, 0),
    avgPerWeek: summaries.length / spanWeeks,
    longestWeekStreak,
    firstDate,
    lastDate,
  }
}
