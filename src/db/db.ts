import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Workout, WorkoutSet } from '../types/hevy'

/**
 * Local-first storage for the imported Hevy history.
 * Everything lives in the user's browser (IndexedDB) — nothing is uploaded.
 */
class HevyStatsDB extends Dexie {
  workouts!: EntityTable<Workout, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  sets!: EntityTable<WorkoutSet, 'id'>

  constructor() {
    super('HevyStatsDB')

    this.version(1).stores({
      workouts: '++id, startTime, title',
      exercises: '++id, workoutId, title',
      sets: '++id, exerciseId, setType',
    })
  }
}

export const db = new HevyStatsDB()
