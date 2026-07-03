import type { Exercise, Workout, WorkoutSet } from '../types/hevy'
import { buildExerciseStats } from './exerciseStats'
import {
  buildWorkoutSummaries,
  computeGlobalStats,
  weeklyVolumes,
} from './stats'
import { formatSeconds } from './format'

const MAX_EXERCISES = 40
const MAX_RECENT_WORKOUTS = 8
const MAX_WEEKS = 16

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Compact plain-text summary of the whole training history, used as LLM
 * context. Aggregates only — the raw per-set data would be far too large.
 */
export function formatCoachContext(
  workouts: Workout[],
  exercises: Exercise[],
  sets: WorkoutSet[],
): string {
  const summaries = buildWorkoutSummaries(workouts, exercises, sets)
  const global = computeGlobalStats(summaries)
  if (!global) return 'The user has not imported any training data yet.'

  const lines: string[] = []

  lines.push('# Training data summary (Hevy export)')
  lines.push('')
  lines.push('## Overview')
  lines.push(
    `- ${global.totalWorkouts} workouts from ${isoDate(global.firstDate)} to ${isoDate(global.lastDate)}`,
  )
  lines.push(`- Total working volume: ${Math.round(global.totalVolumeKg)} kg`)
  lines.push(`- Average ${global.avgPerWeek.toFixed(1)} workouts per week`)
  lines.push(
    `- Longest streak: ${global.longestWeekStreak} consecutive weeks trained`,
  )

  lines.push('')
  lines.push(`## Recent workouts (last ${MAX_RECENT_WORKOUTS})`)
  for (const s of summaries.slice(0, MAX_RECENT_WORKOUTS)) {
    lines.push(
      `- ${isoDate(s.workout.startTime)} "${s.workout.title}": ${s.exerciseCount} exercises, ${s.setCount} sets, ${Math.round(s.volumeKg)} kg, ${s.durationMinutes} min`,
    )
  }

  const weeks = weeklyVolumes(summaries).slice(-MAX_WEEKS)
  lines.push('')
  lines.push(`## Weekly volume (kg, last ${weeks.length} weeks)`)
  lines.push(
    weeks
      .map((w) => `${isoDate(w.weekStart)}: ${Math.round(w.volumeKg)}`)
      .join(' | '),
  )

  const exerciseStats = buildExerciseStats(workouts, exercises, sets)
  lines.push('')
  lines.push(
    `## Exercises (top ${Math.min(MAX_EXERCISES, exerciseStats.length)} of ${exerciseStats.length}, by session count)`,
  )
  for (const ex of exerciseStats.slice(0, MAX_EXERCISES)) {
    const parts: string[] = [
      `${ex.sessionCount} sessions`,
      `last ${isoDate(ex.lastPerformed)}`,
    ]
    if (ex.bestWeight) {
      parts.push(
        `best weight ${ex.bestWeight.weightKg} kg x ${ex.bestWeight.reps} (${isoDate(ex.bestWeight.date)})`,
      )
    }
    if (ex.bestE1rm) {
      parts.push(
        `best e1RM ${Math.round(ex.bestE1rm.value)} kg (${ex.bestE1rm.weightKg} kg x ${ex.bestE1rm.reps}, ${isoDate(ex.bestE1rm.date)})`,
      )
    }
    const latestE1rm = [...ex.sessions]
      .reverse()
      .find((s) => s.bestE1rm !== null)
    if (latestE1rm?.bestE1rm != null) {
      parts.push(
        `latest e1RM ${Math.round(latestE1rm.bestE1rm)} kg (${isoDate(latestE1rm.date)})`,
      )
    }
    if (ex.maxReps) parts.push(`max reps ${ex.maxReps.reps}`)
    if (ex.maxDuration)
      parts.push(`max duration ${formatSeconds(ex.maxDuration.seconds)}`)
    lines.push(`- ${ex.title}: ${parts.join('; ')}`)
  }

  return lines.join('\n')
}
