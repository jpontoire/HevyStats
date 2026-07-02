import type { WorkoutSet } from '../types/hevy'
import { formatSeconds } from './format'

/** One-line human description of a set: "60 kg × 6", "12 reps", "2.5 km · 15 min"… */
export function describeSet(set: WorkoutSet): string {
  const parts: string[] = []
  if (set.distanceKm !== null) parts.push(`${set.distanceKm} km`)
  if (set.durationSeconds !== null)
    parts.push(formatSeconds(set.durationSeconds))
  if (set.weightKg !== null) parts.push(`${set.weightKg} kg × ${set.reps ?? 0}`)
  else if (set.reps !== null) parts.push(`${set.reps} reps`)
  return parts.join(' · ') || '—'
}
