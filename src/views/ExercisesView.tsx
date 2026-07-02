import { useState } from 'react'
import TimeRangeFilter from '../components/TimeRangeFilter'
import { useExerciseStats } from '../hooks/useExerciseStats'
import { formatCompact, formatDate } from '../utils/format'
import type { TimeRange } from '../utils/timeRange'

interface ExercisesViewProps {
  onOpenExercise: (title: string) => void
}

function ExercisesView({ onOpenExercise }: ExercisesViewProps) {
  const [range, setRange] = useState<TimeRange>('all')
  const [query, setQuery] = useState('')
  const stats = useExerciseStats(range)

  if (stats === undefined) return null

  const visible = stats.filter((s) =>
    s.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Exercises
        </h1>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search exercises…"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {visible.length === 0 ? (
        <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">
          No exercises {query ? 'match your search' : 'in this period'}.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((exercise) => (
            <li key={exercise.title}>
              <button
                type="button"
                onClick={() => onOpenExercise(exercise.title)}
                className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-500"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {exercise.title}
                  </span>
                  <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
                    {exercise.bestE1rm
                      ? `e1RM ${Math.round(exercise.bestE1rm.value)} kg`
                      : exercise.maxReps
                        ? `${exercise.maxReps.reps} reps max`
                        : exercise.maxDuration
                          ? `${exercise.maxDuration.seconds} s max`
                          : ''}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {exercise.sessionCount} session
                  {exercise.sessionCount === 1 ? '' : 's'} ·{' '}
                  {exercise.totalSets} sets
                  {exercise.totalVolumeKg > 0 &&
                    ` · ${formatCompact(exercise.totalVolumeKg)} kg`}{' '}
                  · last {formatDate(exercise.lastPerformed)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default ExercisesView
