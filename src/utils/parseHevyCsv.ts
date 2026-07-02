import Papa from 'papaparse'
import type { HevyCsvRow, ParsedWorkout, SetType } from '../types/hevy'
import { parseHevyDate } from './parseHevyDate'

export interface ParseResult {
  /** Workouts sorted by start time, oldest first. */
  workouts: ParsedWorkout[]
  totalRows: number
  skippedRows: number
  /** Human-readable messages for the first problematic rows (capped). */
  errors: string[]
}

const MAX_REPORTED_ERRORS = 10

const REQUIRED_COLUMNS = [
  'title',
  'start_time',
  'end_time',
  'exercise_title',
  'set_index',
  'set_type',
  'weight_kg',
  'reps',
]

const SET_TYPES: ReadonlySet<string> = new Set([
  'normal',
  'warmup',
  'failure',
  'dropset',
] satisfies SetType[])

/**
 * Parse a Hevy `workout_data.csv` export (one row per set) and group rows
 * into workouts → exercises → sets. Throws if the file does not look like
 * a Hevy export at all; individual malformed rows are skipped and reported.
 */
export async function parseHevyCsv(input: File | string): Promise<ParseResult> {
  const raw = typeof input === 'string' ? input : await input.text()
  // Hevy exports mix line endings: most rows end with \r\n but some workout
  // boundaries use a bare \n, which PapaParse's newline auto-detection would
  // silently merge into the previous row. Normalize before parsing.
  const text = raw.replace(/\r\n?/g, '\n')

  const results = Papa.parse<HevyCsvRow>(text, {
    header: true,
    skipEmptyLines: 'greedy',
  })

  const fields = results.meta.fields ?? []
  const missing = REQUIRED_COLUMNS.filter((c) => !fields.includes(c))
  if (missing.length > 0) {
    throw new Error(
      `This file does not look like a Hevy export (missing columns: ${missing.join(', ')})`,
    )
  }

  const errors = results.errors
    .slice(0, MAX_REPORTED_ERRORS)
    .map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`)

  return groupRows(results.data, errors)
}

function groupRows(rows: HevyCsvRow[], errors: string[]): ParseResult {
  const workouts = new Map<string, ParsedWorkout>()
  let skippedRows = 0

  const skip = (rowNumber: number, reason: string) => {
    skippedRows++
    if (errors.length < MAX_REPORTED_ERRORS) {
      errors.push(`Row ${rowNumber}: ${reason}`)
    }
  }

  rows.forEach((row, index) => {
    // +2 = 1-based numbering plus the header line, so it matches the raw file
    const rowNumber = index + 2

    const exerciseTitle = row.exercise_title?.trim()
    if (!exerciseTitle) {
      skip(rowNumber, 'missing exercise title')
      return
    }

    const startTime = parseHevyDate(row.start_time ?? '')
    if (!startTime) {
      skip(rowNumber, `unrecognized start_time "${row.start_time}"`)
      return
    }

    const key = `${startTime.getTime()}|${row.title}`
    let workout = workouts.get(key)
    if (!workout) {
      workout = {
        title: row.title?.trim() || 'Workout',
        startTime,
        endTime: parseHevyDate(row.end_time ?? '') ?? startTime,
        description: row.description?.trim() ?? '',
        exercises: [],
      }
      workouts.set(key, workout)
    }

    // Rows of one exercise are contiguous in the export; a title change
    // starts a new exercise block (the same exercise done again later in
    // the workout stays a separate block, keeping set_index consistent).
    let exercise = workout.exercises[workout.exercises.length - 1]
    if (!exercise || exercise.title !== exerciseTitle) {
      exercise = {
        title: exerciseTitle,
        supersetId: toNumber(row.superset_id),
        notes: row.exercise_notes?.trim() ?? '',
        sets: [],
      }
      workout.exercises.push(exercise)
    }

    exercise.sets.push({
      setIndex: toNumber(row.set_index) ?? exercise.sets.length,
      setType: toSetType(row.set_type),
      weightKg: toNumber(row.weight_kg),
      reps: toNumber(row.reps),
      distanceKm: toNumber(row.distance_km),
      durationSeconds: toNumber(row.duration_seconds),
      rpe: toNumber(row.rpe),
    })
  })

  return {
    workouts: [...workouts.values()].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    ),
    totalRows: rows.length,
    skippedRows,
    errors,
  }
}

function toNumber(raw: string | undefined): number | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  const value = Number(trimmed.replace(',', '.'))
  return Number.isNaN(value) ? null : value
}

function toSetType(raw: string | undefined): SetType {
  const normalized = raw?.trim().toLowerCase() ?? ''
  return SET_TYPES.has(normalized) ? (normalized as SetType) : 'normal'
}
