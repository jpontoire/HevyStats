import { useState } from 'react'
import { db } from '../db/db'
import MuscleSetsChart from '../components/charts/MuscleSetsChart'
import TimeRangeFilter from '../components/TimeRangeFilter'
import { useLlmConfig } from '../hooks/useLlmConfig'
import { useMuscleStats } from '../hooks/useMuscleStats'
import { classifyWithAi } from '../muscles/aiClassify'
import {
  isMuscleGroup,
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
} from '../muscles/taxonomy'
import type { TimeRange } from '../utils/timeRange'

type AiStatus =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'done'; saved: number }
  | { state: 'error'; message: string }

function MusclesView() {
  const [range, setRange] = useState<TimeRange>('all')
  const [aiStatus, setAiStatus] = useState<AiStatus>({ state: 'idle' })
  const { config } = useLlmConfig()
  const stats = useMuscleStats(range)

  if (stats === undefined) return null

  const unclassified = stats.exercises.filter(
    (e) => e.group === 'other' && e.source === 'auto',
  )

  const runAiClassification = async () => {
    if (!config) return
    setAiStatus({ state: 'running' })
    try {
      const saved = await classifyWithAi(
        config,
        unclassified.map((e) => e.title),
      )
      setAiStatus({ state: 'done', saved })
    } catch (cause) {
      setAiStatus({
        state: 'error',
        message: cause instanceof Error ? cause.message : String(cause),
      })
    }
  }

  const assign = async (title: string, value: string) => {
    if (!isMuscleGroup(value)) return
    await db.muscleMap.put({ title, group: value, source: 'manual' })
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          Muscles
        </h1>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      {stats.exercises.length === 0 ? (
        <p className="py-12 text-center text-neutral-500 dark:text-neutral-400">
          No workouts in this period.
        </p>
      ) : (
        <>
          <MuscleSetsChart groups={stats.groups} />

          {unclassified.length > 0 && (
            <section
              aria-label="Unclassified exercises"
              className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30"
            >
              <p className="text-amber-800 dark:text-amber-300">
                {unclassified.length} exercise
                {unclassified.length === 1 ? '' : 's'} could not be classified
                automatically. Fix them below, or let your configured AI do it.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void runAiClassification()}
                  disabled={!config || aiStatus.state === 'running'}
                  className="w-fit rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {aiStatus.state === 'running'
                    ? 'Classifying…'
                    : 'Classify with AI'}
                </button>
                {!config && (
                  <span className="text-amber-700 dark:text-amber-400">
                    Configure a provider in the Coach tab first.
                  </span>
                )}
              </div>
              {aiStatus.state === 'error' && (
                <p className="text-red-600 dark:text-red-400">
                  {aiStatus.message}
                </p>
              )}
            </section>
          )}
          {aiStatus.state === 'done' && (
            <p className="text-sm text-green-700 dark:text-green-400">
              AI classified {aiStatus.saved} exercise
              {aiStatus.saved === 1 ? '' : 's'}. Review below and adjust if
              needed.
            </p>
          )}

          <section aria-label="Exercise assignments">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Exercise assignments
            </h2>
            <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Assignments are guessed from the exercise name (or by AI). Your
              manual choices always win and are remembered.
            </p>
            <ul className="flex flex-col gap-1.5">
              {stats.exercises.map((exercise) => (
                <li
                  key={exercise.title}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {exercise.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {exercise.sets} sets ·{' '}
                      {exercise.source === 'auto'
                        ? 'auto'
                        : exercise.source === 'ai'
                          ? 'AI'
                          : 'manual'}
                    </p>
                  </div>
                  <select
                    value={exercise.group}
                    onChange={(event) =>
                      void assign(exercise.title, event.target.value)
                    }
                    aria-label={`Muscle group for ${exercise.title}`}
                    className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
                  >
                    {MUSCLE_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {MUSCLE_LABELS[group]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}

export default MusclesView
