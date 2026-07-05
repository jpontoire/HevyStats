import { formatDate } from '../utils/format'
import type { PrEvent, PrKind } from '../utils/prEvents'

interface RecentPrsProps {
  events: PrEvent[]
}

function describe(event: PrEvent): string {
  const labels: Record<PrKind, string> = {
    e1rm: `e1RM ${event.value} kg`,
    weight: `${event.value} kg`,
    reps: `${event.value} reps`,
  }
  return labels[event.kind]
}

/** Feed of genuine record improvements (first-ever values don't count). */
function RecentPrs({ events }: RecentPrsProps) {
  return (
    <section
      aria-label="Recent personal records"
      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Recent PRs
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          No records beaten in this period. Time to chase one?
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {events.map((event) => (
            <li
              key={`${event.exerciseTitle}|${event.date.getTime()}`}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {event.exerciseTitle}
                </p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  {describe(event)}
                  {event.kind === 'e1rm' && ` (${event.detail})`} · beat{' '}
                  {event.previous}
                  {event.kind === 'reps' ? '' : ' kg'}
                </p>
              </div>
              <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                {formatDate(event.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecentPrs
