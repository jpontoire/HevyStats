const compactFormat = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 1284 → "1.3K", 486123 → "486.1K" */
export function formatCompact(value: number): string {
  return compactFormat.format(value)
}

/** Browser-locale short date, e.g. "30 Jun 2026" / "30 juin 2026". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

export function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return seconds === 0
    ? `${minutes} min`
    : `${minutes}:${String(seconds).padStart(2, '0')} min`
}
