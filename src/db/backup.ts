import { db } from './db'

/**
 * Full JSON dump of the local database, for backup or moving to another
 * browser. Dates are serialized as ISO strings by JSON.stringify.
 */
export async function exportBackup(): Promise<Blob> {
  const [workouts, exercises, sets] = await Promise.all([
    db.workouts.toArray(),
    db.exercises.toArray(),
    db.sets.toArray(),
  ])
  const payload = {
    app: 'HevyStats',
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts,
    exercises,
    sets,
  }
  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

/** Wipe every table. Irreversible — callers must confirm with the user first. */
export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', db.workouts, db.exercises, db.sets, async () => {
    await Promise.all([
      db.workouts.clear(),
      db.exercises.clear(),
      db.sets.clear(),
    ])
  })
}
