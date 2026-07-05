import { useLiveQuery } from 'dexie-react-hooks'
import StatTile from '../components/StatTile'
import ProgressionChart from '../components/charts/ProgressionChart'
import { db } from '../db/db'
import { computeTrends } from '../utils/progressTrends'
import { describeSet } from '../utils/describeSet'
import { buildExerciseStats } from '../utils/exerciseStats'
import {
  formatCompact,
  formatDate,
  formatSeconds,
} from '../utils/format'

interface ExerciseDetailViewProps {
  title: string
  onBack: () => void
  onOpenWorkout: (id: number) => void
}

function ExerciseDetailView({
  title,
  onBack,
  onOpenWorkout,
}: ExerciseDetailViewProps) {
  const stats = useLiveQuery(async () => {
    const [workouts, exercises, sets] = await Promise.all([
      db.workouts.toArray(),
      db.exercises.where('title').equals(title).toArray(),
      db.sets.toArray(),
    ])
    return (
      buildExerciseStats(workouts, exercises, sets).find(
        (s) => s.title === title,
      ) ?? null
    )
  }, [title])

  if (stats === undefined) return null
  if (stats === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Exercise not found.
        </p>
      </main>
    )
  }

  const history = [...stats.sessions].reverse()
  const trend = computeTrends([stats])[0]

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back
        </button>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl tracking-tight text-neutral-900 dark:text-neutral-100">
          {stats.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {stats.sessionCount} session{stats.sessionCount === 1 ? '' : 's'} ·{' '}
          {stats.totalSets} working sets · last{' '}
          {formatDate(stats.lastPerformed)}
        </p>
        {trend && trend.direction !== 'flat' && (
          <p
            className={`mt-1 text-sm font-medium ${
              trend.direction === 'up'
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} e1RM{' '}
            {trend.deltaKg > 0 ? '+' : ''}
            {trend.deltaKg} kg over the last 30 days (vs previous 90)
          </p>
        )}
      </div>

      <section
        aria-label="Personal records"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {stats.bestWeight && (
          <StatTile
            label="Best weight"
            value={`${stats.bestWeight.weightKg} kg`}
            detail={`× ${stats.bestWeight.reps} · ${formatDate(stats.bestWeight.date)}`}
          />
        )}
        {stats.bestE1rm && (
          <StatTile
            label="Best e1RM"
            value={`${Math.round(stats.bestE1rm.value)} kg`}
            detail={`${stats.bestE1rm.weightKg} kg × ${stats.bestE1rm.reps} · ${formatDate(stats.bestE1rm.date)}`}
          />
        )}
        {stats.maxReps && (
          <StatTile
            label="Max reps"
            value={String(stats.maxReps.reps)}
            detail={formatDate(stats.maxReps.date)}
          />
        )}
        {stats.maxDuration && (
          <StatTile
            label="Max duration"
            value={formatSeconds(stats.maxDuration.seconds)}
            detail={formatDate(stats.maxDuration.date)}
          />
        )}
        {stats.totalVolumeKg > 0 && (
          <StatTile
            label="Total volume"
            value={`${formatCompact(stats.totalVolumeKg)} kg`}
          />
        )}
      </section>

      <ProgressionChart sessions={stats.sessions} />

      <section aria-label="Session history">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          History
        </h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full bg-white text-sm dark:bg-neutral-900">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="px-3 py-2 font-medium sm:px-4">Date</th>
                <th className="px-3 py-2 font-medium sm:px-4">Best set</th>
                <th className="px-3 py-2 text-right font-medium sm:px-4">e1RM</th>
                <th className="px-3 py-2 text-right font-medium sm:px-4">Sets</th>
                <th className="px-3 py-2 text-right font-medium sm:px-4">Volume</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700 dark:text-neutral-300">
              {history.map((session) => (
                <tr
                  key={`${session.workoutId}`}
                  onClick={() => onOpenWorkout(session.workoutId)}
                  className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
                >
                  <td className="px-3 py-2 whitespace-nowrap sm:px-4">
                    {formatDate(session.date)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap sm:px-4">
                    {session.topSet ? describeSet(session.topSet) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums sm:px-4">
                    {session.bestE1rm !== null
                      ? `${Math.round(session.bestE1rm)} kg`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums sm:px-4">
                    {session.setCount}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums sm:px-4">
                    {session.volumeKg > 0
                      ? `${formatCompact(session.volumeKg)} kg`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default ExerciseDetailView
