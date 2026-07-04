import { useCallback, useState } from 'react'
import { parseHevyCsv } from '../utils/parseHevyCsv'
import { importWorkouts, type ImportSummary } from '../db/importWorkouts'
import { importBackup } from '../db/backup'

export type ImportStatus = 'idle' | 'importing' | 'success' | 'error'

export interface CsvImportResult extends ImportSummary {
  skippedRows: number
  parseErrors: string[]
}

function isJsonBackup(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith('.json') ||
    file.type === 'application/json'
  )
}

/**
 * Import a Hevy CSV export or a HevyStats JSON backup into IndexedDB,
 * tracking UI state. Both paths share the same workout deduplication.
 */
export function useCsvImport() {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const importFile = useCallback(async (file: File) => {
    setStatus('importing')
    setResult(null)
    setError(null)
    try {
      if (isJsonBackup(file)) {
        const summary = await importBackup(await file.text())
        setResult({ ...summary, skippedRows: 0, parseErrors: [] })
      } else {
        const parsed = await parseHevyCsv(file)
        const summary = await importWorkouts(parsed.workouts)
        setResult({
          ...summary,
          skippedRows: parsed.skippedRows,
          parseErrors: parsed.errors,
        })
      }
      setStatus('success')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [])

  return { status, result, error, importFile }
}
