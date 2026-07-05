import type { Exercise, Workout, WorkoutSet } from '../types/hevy'
import { estimateOneRepMax } from './stats'

export type PrKind = 'e1rm' | 'weight' | 'reps'

export interface PrEvent {
  date: Date
  exerciseTitle: string
  kind: PrKind
  /** New record value (kg for weight/e1rm, count for reps). */
  value: number
  /** Record it beat. */
  previous: number
  /** The set that did it, e.g. "60 kg × 6". */
  detail: string
}

interface Running {
  weight: number | null
  e1rm: number | null
  reps: number | null
}

const KIND_PRIORITY: PrKind[] = ['e1rm', 'weight', 'reps']

/**
 * Chronological personal-record events: every time a working set beat the
 * exercise's previous best (e1RM, weight with ≥1 rep, or bodyweight reps).
 * The first-ever value of an exercise is a baseline, not an event — only
 * genuine improvements are reported. One event per exercise per workout
 * (the most meaningful kind wins). Newest first.
 */
export function computePrEvents(
  workouts: Workout[],
  exercises: Exercise[],
  sets: WorkoutSet[],
): PrEvent[] {
  const workoutById = new Map(workouts.map((w) => [w.id, w]))
  const setsByExercise = new Map<number, WorkoutSet[]>()
  for (const set of sets) {
    if (set.setType === 'warmup') continue
    const list = setsByExercise.get(set.exerciseId) ?? []
    list.push(set)
    setsByExercise.set(set.exerciseId, list)
  }

  // Exercise instances per title, in chronological workout order
  const instancesByTitle = new Map<string, { date: Date; sets: WorkoutSet[] }[]>()
  for (const exercise of exercises) {
    const workout = workoutById.get(exercise.workoutId)
    const exerciseSets = setsByExercise.get(exercise.id)
    if (!workout || !exerciseSets) continue
    const list = instancesByTitle.get(exercise.title) ?? []
    list.push({ date: workout.startTime, sets: exerciseSets })
    instancesByTitle.set(exercise.title, list)
  }

  const events: PrEvent[] = []

  for (const [title, instances] of instancesByTitle) {
    instances.sort((a, b) => a.date.getTime() - b.date.getTime())
    const best: Running = { weight: null, e1rm: null, reps: null }

    for (const { date, sets: daySets } of instances) {
      const candidates = new Map<PrKind, PrEvent>()

      for (const set of daySets) {
        if (set.weightKg !== null && set.reps !== null && set.reps >= 1) {
          const e1rm = estimateOneRepMax(set.weightKg, set.reps)
          if (e1rm !== null) {
            const rounded = Math.round(e1rm)
            if (best.e1rm !== null && rounded > Math.round(best.e1rm)) {
              candidates.set('e1rm', {
                date,
                exerciseTitle: title,
                kind: 'e1rm',
                value: rounded,
                previous: Math.round(best.e1rm),
                detail: `${set.weightKg} kg × ${set.reps}`,
              })
            }
            if (best.e1rm === null || e1rm > best.e1rm) best.e1rm = e1rm
          }
          if (best.weight !== null && set.weightKg > best.weight) {
            candidates.set('weight', {
              date,
              exerciseTitle: title,
              kind: 'weight',
              value: set.weightKg,
              previous: best.weight,
              detail: `${set.weightKg} kg × ${set.reps}`,
            })
          }
          if (best.weight === null || set.weightKg > best.weight) {
            best.weight = set.weightKg
          }
        } else if (set.weightKg === null && set.reps !== null) {
          if (best.reps !== null && set.reps > best.reps) {
            candidates.set('reps', {
              date,
              exerciseTitle: title,
              kind: 'reps',
              value: set.reps,
              previous: best.reps,
              detail: `${set.reps} reps`,
            })
          }
          if (best.reps === null || set.reps > best.reps) best.reps = set.reps
        }
      }

      const kind = KIND_PRIORITY.find((k) => candidates.has(k))
      if (kind) events.push(candidates.get(kind)!)
    }
  }

  return events.sort((a, b) => b.date.getTime() - a.date.getTime())
}
