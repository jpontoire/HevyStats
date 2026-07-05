import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import TimeRangeFilter from '../components/TimeRangeFilter'
import { db } from '../db/db'
import { useExerciseStats } from '../hooks/useExerciseStats'
import { makeMuscleResolver } from '../muscles/resolve'
import {
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  type MuscleGroup,
} from '../muscles/taxonomy'
import { formatCompact, formatDate } from '../utils/format'
import type { TimeRange } from '../utils/timeRange'

interface ExercisesViewProps {
  onOpenExercise: (title: string) => void
}

function ExercisesView({ onOpenExercise }: ExercisesViewProps) {
  const [range, setRange] = useState<TimeRange>('all')
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const stats = useExerciseStats(range)
  const muscleOverrides = useLiveQuery(() => db.muscleMap.toArray())

  if (stats === undefined || muscleOverrides === undefined) return null

  const resolveMuscle = makeMuscleResolver(muscleOverrides)
  const groupByTitle = new Map(
    stats.map((s) => [s.title, resolveMuscle(s.title)]),
  )
  // Only offer chips for groups that actually appear in this period
  const presentGroups = MUSCLE_GROUPS.filter((group) =>
    stats.some((s) => groupByTitle.get(s.title) === group),
  )

  const visible = stats.filter(
    (s) =>
      s.title.toLowerCase().includes(query.trim().toLowerCase()) &&
      (muscle === 'all' || groupByTitle.get(s.title) === muscle),
  )

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
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

      <div
        role="group"
        aria-label="Filter by muscle group"
        className="flex flex-wrap gap-1.5"
      >
        {(['all', ...presentGroups] as const).map((group) => (
          <button
            key={group}
            type="button"
            aria-pressed={muscle === group}
            onClick={() => setMuscle(group === 'all' ? 'all' : group)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              muscle === group
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'border border-neutral-200 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
            }`}
          >
            {group === 'all' ? 'All' : MUSCLE_LABELS[group]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">
          No exercises{' '}
          {query || muscle !== 'all' ? 'match your filters' : 'in this period'}.
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
                  {MUSCLE_LABELS[groupByTitle.get(exercise.title) ?? 'other']}{' '}
                  · {exercise.sessionCount} session
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
