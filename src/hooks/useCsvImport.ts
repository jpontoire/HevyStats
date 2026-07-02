import { useCallback, useState } from 'react'
import { parseHevyCsv } from '../utils/parseHevyCsv'
import { importWorkouts, type ImportSummary } from '../db/importWorkouts'

export type ImportStatus = 'idle' | 'importing' | 'success' | 'error'

export interface CsvImportResult extends ImportSummary {
  skippedRows: number
  parseErrors: string[]
}

/** Parse a Hevy CSV file and persist it into IndexedDB, tracking UI state. */
export function useCsvImport() {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const importFile = useCallback(async (file: File) => {
    setStatus('importing')
    setResult(null)
    setError(null)
    try {
      const parsed = await parseHevyCsv(file)
      const summary = await importWorkouts(parsed.workouts)
      setResult({
        ...summary,
        skippedRows: parsed.skippedRows,
        parseErrors: parsed.errors,
      })
      setStatus('success')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [])

  return { status, result, error, importFile }
}
