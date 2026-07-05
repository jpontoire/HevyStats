import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { deleteAllData, exportBackup } from '../db/backup'
import DropZone from '../components/DropZone'
import StatTile from '../components/StatTile'
import ProgressionChart from '../components/charts/ProgressionChart'
import WeeklyVolumeChart from '../components/charts/WeeklyVolumeChart'
import { useCsvImport } from '../hooks/useCsvImport'
import { SAMPLE_PROGRESSION, SAMPLE_WEEKLY_VOLUME } from '../utils/sampleData'

async function downloadBackup() {
  const blob = await exportBackup()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `hevystats-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function HomeView() {
  const { status, result, error, importFile } = useCsvImport()
  const workoutCount = useLiveQuery(() => db.workouts.count())

  const confirmDelete = async () => {
    const confirmed = window.confirm(
      'Delete all locally stored workouts? This cannot be undone. ' +
        'Consider exporting a backup first.',
    )
    if (confirmed) await deleteAllData()
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 text-center">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          HevyStats
        </h1>
        <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
          Drop your Hevy CSV export to unlock your full history and get
          advanced strength and volume statistics, computed and stored locally
          in your browser.
        </p>
      </header>

      <DropZone onFile={importFile} disabled={status === 'importing'} />

      <p className="max-w-xl text-xs text-neutral-400 dark:text-neutral-500">
        To get your export: in the Hevy app, go to Profile → Settings → Export
        &amp; Import Data → Export Workouts. You'll receive a{' '}
        <code className="font-mono">workout_data.csv</code> file with your full
        history — even sessions the free app no longer shows.
      </p>

      <section aria-live="polite" className="flex flex-col gap-2">
        {status === 'importing' && (
          <p className="text-neutral-600 dark:text-neutral-400">Importing…</p>
        )}

        {status === 'success' && result && (
          <div className="flex flex-col gap-1">
            <p className="font-medium text-green-700 dark:text-green-400">
              Import finished: {result.workoutsAdded} workout
              {result.workoutsAdded === 1 ? '' : 's'} added
              {result.workoutsSkipped > 0 &&
                `, ${result.workoutsSkipped} already present`}
              {result.setsAdded > 0 && ` (${result.setsAdded} sets)`}.
            </p>
            {(result.skippedRows > 0 || result.parseErrors.length > 0) && (
              <details className="text-sm text-amber-700 dark:text-amber-400">
                <summary className="cursor-pointer">
                  {Math.max(result.skippedRows, result.parseErrors.length)} row
                  {Math.max(result.skippedRows, result.parseErrors.length) === 1
                    ? ''
                    : 's'}{' '}
                  had issues
                </summary>
                <ul className="mt-1 list-inside list-disc text-left">
                  {result.parseErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {status === 'error' && error && (
          <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
        )}

        {workoutCount !== undefined && workoutCount > 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {workoutCount} workout{workoutCount === 1 ? '' : 's'} stored
            locally.
          </p>
        )}
      </section>

      {workoutCount === 0 && (
        <section
          aria-label="Feature preview"
          className="flex w-full flex-col gap-4 text-left"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              What you'll get
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              A preview with sample data — import your export to see your own
              numbers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Workouts" value="112" detail="full history" />
            <StatTile label="Total volume" value="540.7K kg" />
            <StatTile
              label="Best bench e1RM"
              value="74 kg"
              detail="+16 kg in 3 months"
            />
            <StatTile
              label="Longest streak"
              value="27 wk"
              detail="consecutive weeks trained"
            />
          </div>

          <ProgressionChart sessions={SAMPLE_PROGRESSION} />
          <WeeklyVolumeChart weeks={SAMPLE_WEEKLY_VOLUME} />

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Plus per-exercise personal records, a filterable dashboard, and an
            AI coach that answers questions about your training — powered by
            your own API key or a local model.
          </p>
        </section>
      )}

      {workoutCount !== undefined && workoutCount > 0 && (
        <section
          aria-label="Data management"
          className="flex gap-4 text-sm text-neutral-500 dark:text-neutral-400"
        >
          <button
            type="button"
            onClick={() => void downloadBackup()}
            className="underline transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Export JSON backup
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            className="underline transition-colors hover:text-red-600 dark:hover:text-red-400"
          >
            Delete all my data
          </button>
        </section>
      )}
    </main>
  )
}

export default HomeView
