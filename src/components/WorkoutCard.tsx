import type { WorkoutSummary } from '../utils/stats'
import { formatCompact, formatDate, formatDuration } from '../utils/format'

interface WorkoutCardProps {
  summary: WorkoutSummary
  onClick: () => void
}

function WorkoutCard({ summary, onClick }: WorkoutCardProps) {
  const { workout, exerciseCount, setCount, volumeKg, durationMinutes } =
    summary

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-500"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {workout.title}
        </span>
        <span className="shrink-0 text-sm text-neutral-500 dark:text-neutral-400">
          {formatDate(workout.startTime)}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'} · {setCount}{' '}
        sets · {formatCompact(volumeKg)} kg ·{' '}
        {formatDuration(durationMinutes)}
      </p>
    </button>
  )
}

export default WorkoutCard
