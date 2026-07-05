import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { classifyExercise } from '../muscles/classify'
import type { MuscleGroup } from '../muscles/taxonomy'
import { setVolumeKg } from '../utils/stats'
import { rangeStart, type TimeRange } from '../utils/timeRange'

export interface MuscleGroupStat {
  group: MuscleGroup
  sets: number
  volumeKg: number
}

export interface ExerciseAssignment {
  title: string
  sets: number
  group: MuscleGroup
  /** Where the assignment comes from; 'auto' = keyword heuristic. */
  source: 'auto' | 'ai' | 'manual'
}

export interface MuscleStats {
  /** Groups with at least one working set in range, most worked first. */
  groups: MuscleGroupStat[]
  /** Every exercise seen in range with its resolved group, most sets first. */
  exercises: ExerciseAssignment[]
}

/** Working sets and volume per primary muscle group over the given range. */
export function useMuscleStats(range: TimeRange): MuscleStats | undefined {
  return useLiveQuery(async () => {
    const start = rangeStart(range)
    const [workouts, exercises, sets, overrides] = await Promise.all([
      start
        ? db.workouts.where('startTime').aboveOrEqual(start).toArray()
        : db.workouts.toArray(),
      db.exercises.toArray(),
      db.sets.toArray(),
      db.muscleMap.toArray(),
    ])

    const workoutIds = new Set(workouts.map((w) => w.id))
    const exerciseById = new Map(
      exercises
        .filter((e) => workoutIds.has(e.workoutId))
        .map((e) => [e.id, e]),
    )

    // Working sets and volume per exercise title within the range
    const perTitle = new Map<string, { sets: number; volumeKg: number }>()
    for (const set of sets) {
      if (set.setType === 'warmup') continue
      const exercise = exerciseById.get(set.exerciseId)
      if (!exercise) continue
      const entry = perTitle.get(exercise.title) ?? { sets: 0, volumeKg: 0 }
      entry.sets++
      entry.volumeKg += setVolumeKg(set)
      perTitle.set(exercise.title, entry)
    }

    const overrideByTitle = new Map(overrides.map((o) => [o.title, o]))
    const perGroup = new Map<MuscleGroup, MuscleGroupStat>()
    const exerciseList: ExerciseAssignment[] = []

    for (const [title, entry] of perTitle) {
      const override = overrideByTitle.get(title)
      const group = override?.group ?? classifyExercise(title)
      const source = override?.source ?? 'auto'
      exerciseList.push({ title, sets: entry.sets, group, source })

      const stat = perGroup.get(group) ?? { group, sets: 0, volumeKg: 0 }
      stat.sets += entry.sets
      stat.volumeKg += entry.volumeKg
      perGroup.set(group, stat)
    }

    return {
      groups: [...perGroup.values()].sort((a, b) => b.sets - a.sets),
      exercises: exerciseList.sort((a, b) => b.sets - a.sets),
    }
  }, [range])
}
