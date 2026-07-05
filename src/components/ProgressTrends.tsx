import type { ExerciseTrend } from '../utils/progressTrends'

interface ProgressTrendsProps {
  trends: ExerciseTrend[]
}

const DIRECTION_STYLE = {
  up: { arrow: '↑', className: 'text-green-700 dark:text-green-400' },
  flat: { arrow: '→', className: 'text-neutral-500 dark:text-neutral-400' },
  down: { arrow: '↓', className: 'text-red-600 dark:text-red-400' },
} as const

/** Plateau detector: best e1RM last 30 days vs the 90 days before. */
function ProgressTrends({ trends }: ProgressTrendsProps) {
  return (
    <section
      aria-label="Strength trends"
      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Strength trends{' '}
        <span className="font-normal text-neutral-500 dark:text-neutral-400">
          (e1RM, last 30 days vs previous 90)
        </span>
      </h2>
      {trends.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Not enough recent data — train an exercise in two different months
          to see its trend.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {trends.map((trend) => {
            const style = DIRECTION_STYLE[trend.direction]
            return (
              <li
                key={trend.title}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <p className="min-w-0 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {trend.title}
                </p>
                <p className="shrink-0 tabular-nums text-neutral-500 dark:text-neutral-400">
                  {trend.previousBest} → {trend.recentBest} kg{' '}
                  <span className={`font-semibold ${style.className}`}>
                    {style.arrow} {trend.deltaKg > 0 ? '+' : ''}
                    {trend.deltaKg}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default ProgressTrends
