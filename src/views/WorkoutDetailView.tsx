import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { WorkoutSet } from '../types/hevy'
import { formatCompact, formatDate, formatDuration } from '../utils/format'
import { setVolumeKg } from '../utils/stats'
import { describeSet } from '../utils/describeSet'

interface WorkoutDetailViewProps {
  workoutId: number
  onBack: () => void
}

const SET_TYPE_BADGES: Partial<Record<WorkoutSet['setType'], string>> = {
  warmup:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  failure: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  dropset:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
}

function WorkoutDetailView({ workoutId, onBack }: WorkoutDetailViewProps) {
  const data = useLiveQuery(async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return null
    const exercises = await db.exercises
      .where('workoutId')
      .equals(workoutId)
      .sortBy('id')
    const sets = await db.sets
      .where('exerciseId')
      .anyOf(exercises.map((e) => e.id))
      .toArray()
    const setsByExercise = new Map<number, WorkoutSet[]>()
    for (const set of sets) {
      const list = setsByExercise.get(set.exerciseId) ?? []
      list.push(set)
      setsByExercise.set(set.exerciseId, list)
    }
    for (const list of setsByExercise.values()) {
      list.sort((a, b) => a.setIndex - b.setIndex)
    }
    return { workout, exercises, setsByExercise }
  }, [workoutId])

  if (data === undefined) return null
  if (data === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Workout not found.
        </p>
      </main>
    )
  }

  const { workout, exercises, setsByExercise } = data
  const allSets = [...setsByExercise.values()].flat()
  const volumeKg = allSets.reduce((total, set) => total + setVolumeKg(set), 0)
  const durationMinutes = Math.max(
    0,
    Math.round(
      (workout.endTime.getTime() - workout.startTime.getTime()) / 60_000,
    ),
  )

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back
        </button>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {workout.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {formatDate(workout.startTime)} · {formatDuration(durationMinutes)} ·{' '}
          {allSets.length} sets · {formatCompact(volumeKg)} kg
        </p>
        {workout.description && (
          <p className="mt-2 text-sm italic text-neutral-600 dark:text-neutral-400">
            {workout.description}
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        {exercises.map((exercise) => (
          <article
            key={exercise.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="font-medium text-neutral-900 dark:text-neutral-100">
              {exercise.title}
            </h2>
            {exercise.notes && (
              <p className="mt-1 text-sm italic text-neutral-500 dark:text-neutral-400">
                {exercise.notes}
              </p>
            )}
            <ol className="mt-3 flex flex-col gap-1.5">
              {(setsByExercise.get(exercise.id) ?? []).map((set, index) => (
                <li
                  key={set.id}
                  className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300"
                >
                  <span className="w-5 shrink-0 text-right text-neutral-400 dark:text-neutral-500">
                    {index + 1}
                  </span>
                  <span>{describeSet(set)}</span>
                  {set.setType !== 'normal' && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${SET_TYPE_BADGES[set.setType] ?? ''}`}
                    >
                      {set.setType}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </main>
  )
}

export default WorkoutDetailView
