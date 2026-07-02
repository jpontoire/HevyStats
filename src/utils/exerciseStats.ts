import type { Exercise, Workout, WorkoutSet } from '../types/hevy'
import { estimateOneRepMax, setVolumeKg } from './stats'

export interface ExerciseSession {
  workoutId: number
  date: Date
  setCount: number
  volumeKg: number
  /** The strongest set of the session (best e1RM, else weight, reps, duration). */
  topSet: WorkoutSet | null
  bestE1rm: number | null
}

export interface ExerciseStats {
  title: string
  sessionCount: number
  totalSets: number
  totalVolumeKg: number
  lastPerformed: Date
  bestWeight: { weightKg: number; reps: number; date: Date } | null
  bestE1rm: { value: number; weightKg: number; reps: number; date: Date } | null
  /** Rep record on bodyweight sets only (weighted rep counts are not comparable). */
  maxReps: { reps: number; date: Date } | null
  maxDuration: { seconds: number; date: Date } | null
  /** Sorted oldest → newest. */
  sessions: ExerciseSession[]
}

function setStrength(set: WorkoutSet): number {
  const e1rm =
    set.weightKg !== null && set.reps !== null
      ? estimateOneRepMax(set.weightKg, set.reps)
      : null
  // Tiered score so any e1RM beats any bare weight, any weight beats bare
  // reps, and reps beat duration — mirrors how "best set" reads to a lifter.
  if (e1rm !== null) return 3_000_000 + e1rm
  if (set.weightKg !== null) return 2_000_000 + set.weightKg
  if (set.reps !== null) return 1_000_000 + set.reps
  if (set.durationSeconds !== null) return set.durationSeconds
  return -1
}

/**
 * Aggregate history per exercise title: sessions, working-set volume and
 * all-time PRs. Warmup sets are ignored throughout.
 */
export function buildExerciseStats(
  workouts: Workout[],
  exercises: Exercise[],
  sets: WorkoutSet[],
): ExerciseStats[] {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))

  const workingSetsByExercise = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    if (set.setType === 'warmup') continue
    const list = workingSetsByExercise.get(set.exerciseId) ?? []
    list.push(set)
    workingSetsByExercise.set(set.exerciseId, list)
  }

  const statsByTitle = new Map<string, ExerciseStats>()
  // Two blocks of the same exercise in one workout merge into one session
  const sessionByKey = new Map<string, ExerciseSession>()

  for (const exercise of exercises) {
    const workout = workoutById.get(exercise.workoutId)
    if (!workout) continue
    const exerciseSets = workingSetsByExercise.get(exercise.id) ?? []
    if (exerciseSets.length === 0) continue
    const date = workout.startTime

    let stats = statsByTitle.get(exercise.title)
    if (!stats) {
      stats = {
        title: exercise.title,
        sessionCount: 0,
        totalSets: 0,
        totalVolumeKg: 0,
        lastPerformed: date,
        bestWeight: null,
        bestE1rm: null,
        maxReps: null,
        maxDuration: null,
        sessions: [],
      }
      statsByTitle.set(exercise.title, stats)
    }

    const sessionKey = `${exercise.title}|${exercise.workoutId}`
    let session = sessionByKey.get(sessionKey)
    if (!session) {
      session = {
        workoutId: exercise.workoutId,
        date,
        setCount: 0,
        volumeKg: 0,
        topSet: null,
        bestE1rm: null,
      }
      sessionByKey.set(sessionKey, session)
      stats.sessions.push(session)
    }

    for (const set of exerciseSets) {
      const volume = setVolumeKg(set)
      stats.totalSets++
      stats.totalVolumeKg += volume
      session.setCount++
      session.volumeKg += volume

      if (!session.topSet || setStrength(set) > setStrength(session.topSet)) {
        session.topSet = set
      }

      if (set.weightKg !== null && set.reps !== null) {
        const e1rm = estimateOneRepMax(set.weightKg, set.reps)
        if (e1rm !== null) {
          session.bestE1rm = Math.max(session.bestE1rm ?? 0, e1rm)
          if (!stats.bestE1rm || e1rm > stats.bestE1rm.value) {
            stats.bestE1rm = {
              value: e1rm,
              weightKg: set.weightKg,
              reps: set.reps,
              date,
            }
          }
        }
        // A weight only counts as a PR if at least one full rep was completed
        if (
          set.reps >= 1 &&
          (!stats.bestWeight || set.weightKg > stats.bestWeight.weightKg)
        ) {
          stats.bestWeight = { weightKg: set.weightKg, reps: set.reps, date }
        }
      } else if (set.reps !== null) {
        if (!stats.maxReps || set.reps > stats.maxReps.reps) {
          stats.maxReps = { reps: set.reps, date }
        }
      }
      if (set.durationSeconds !== null) {
        if (
          !stats.maxDuration ||
          set.durationSeconds > stats.maxDuration.seconds
        ) {
          stats.maxDuration = { seconds: set.durationSeconds, date }
        }
      }
    }

    if (date.getTime() > stats.lastPerformed.getTime()) {
      stats.lastPerformed = date
    }
  }

  for (const stats of statsByTitle.values()) {
    stats.sessions.sort((a, b) => a.date.getTime() - b.date.getTime())
    stats.sessionCount = stats.sessions.length
  }

  return [...statsByTitle.values()].sort(
    (a, b) => b.sessionCount - a.sessionCount || a.title.localeCompare(b.title),
  )
}
