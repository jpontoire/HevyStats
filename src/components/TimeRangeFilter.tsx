import { TIME_RANGES, type TimeRange } from '../utils/timeRange'

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="flex w-fit rounded-lg border border-neutral-200 p-0.5 dark:border-neutral-800"
    >
      {TIME_RANGES.map((range) => (
        <button
          key={range.value}
          type="button"
          aria-pressed={value === range.value}
          onClick={() => onChange(range.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            value === range.value
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

export default TimeRangeFilter
