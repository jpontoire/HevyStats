import StatTile from '../components/StatTile'
import WorkoutCard from '../components/WorkoutCard'
import { useWorkoutSummaries } from '../hooks/useWorkoutSummaries'
import { formatCompact, formatDate, formatMonth } from '../utils/format'
import { computeGlobalStats, type WorkoutSummary } from '../utils/stats'

interface DashboardViewProps {
  onOpenWorkout: (id: number) => void
  onGoToImport: () => void
}

interface MonthGroup {
  label: string
  items: WorkoutSummary[]
}

function groupByMonth(summaries: WorkoutSummary[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  let lastKey = ''
  for (const summary of summaries) {
    const date = summary.workout.startTime
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (key !== lastKey) {
      groups.push({ label: formatMonth(date), items: [] })
      lastKey = key
    }
    groups[groups.length - 1]!.items.push(summary)
  }
  return groups
}

function DashboardView({ onOpenWorkout, onGoToImport }: DashboardViewProps) {
  const summaries = useWorkoutSummaries()
  if (summaries === undefined) return null

  const stats = computeGlobalStats(summaries)
  if (!stats) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          No workouts yet
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Import your Hevy CSV export to see your full training history here.
        </p>
        <button
          type="button"
          onClick={onGoToImport}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Import my data
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
      <section
        aria-label="Overall statistics"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        <StatTile
          label="Workouts"
          value={String(stats.totalWorkouts)}
          detail={`${formatDate(stats.firstDate)} → ${formatDate(stats.lastDate)}`}
        />
        <StatTile
          label="Total volume"
          value={`${formatCompact(stats.totalVolumeKg)} kg`}
        />
        <StatTile
          label="Workouts per week"
          value={stats.avgPerWeek.toFixed(1)}
          detail="average over the whole history"
        />
        <StatTile
          label="Longest streak"
          value={`${stats.longestWeekStreak} wk`}
          detail="consecutive weeks trained"
        />
      </section>

      <section aria-label="Workout history" className="flex flex-col gap-6">
        {groupByMonth(summaries).map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {group.label}
            </h2>
            {group.items.map((summary) => (
              <WorkoutCard
                key={summary.workout.id}
                summary={summary}
                onClick={() => onOpenWorkout(summary.workout.id)}
              />
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}

export default DashboardView
