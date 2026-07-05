import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Workout, WorkoutSet } from '../types/hevy'
import type { MuscleGroup } from '../muscles/taxonomy'

/**
 * Stored muscle-group assignment for one exercise title. Only AI results
 * and manual overrides are stored; heuristic matches are computed on the
 * fly so improved rules apply retroactively.
 */
export interface MuscleAssignment {
  /** Exercise title, exactly as it appears in the export. */
  title: string
  group: MuscleGroup
  source: 'ai' | 'manual'
}

/**
 * Local-first storage for the imported Hevy history.
 * Everything lives in the user's browser (IndexedDB) — nothing is uploaded.
 */
class HevyStatsDB extends Dexie {
  workouts!: EntityTable<Workout, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  sets!: EntityTable<WorkoutSet, 'id'>
  muscleMap!: EntityTable<MuscleAssignment, 'title'>

  constructor() {
    super('HevyStatsDB')

    this.version(1).stores({
      workouts: '++id, startTime, title',
      exercises: '++id, workoutId, title',
      sets: '++id, exerciseId, setType',
    })

    this.version(2).stores({
      muscleMap: 'title',
    })
  }
}

export const db = new HevyStatsDB()
