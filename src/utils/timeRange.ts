export type TimeRange = '3m' | '6m' | '1y' | 'all'

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
]

const RANGE_MONTHS: Record<Exclude<TimeRange, 'all'>, number> = {
  '3m': 3,
  '6m': 6,
  '1y': 12,
}

/** Start date of a range counting back from now; null means no lower bound. */
export function rangeStart(range: TimeRange, now = new Date()): Date | null {
  if (range === 'all') return null
  const start = new Date(now)
  start.setMonth(start.getMonth() - RANGE_MONTHS[range])
  return start
}
