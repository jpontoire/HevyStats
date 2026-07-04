import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { formatDate, formatDateShort, formatSeconds } from '../../utils/format'
import { useElementWidth } from '../../hooks/useElementWidth'
import type { ExerciseSession } from '../../utils/exerciseStats'

interface ProgressionChartProps {
  sessions: ExerciseSession[]
}

interface Series {
  title: string
  unit: string
  format: (value: number) => string
  points: { t: number; value: number }[]
}

/**
 * Pick the strongest available progression metric for this exercise:
 * e1RM for weighted work, best-set reps for bodyweight, duration for holds.
 */
function buildSeries(sessions: ExerciseSession[]): Series | null {
  const e1rmPoints = sessions
    .filter((s) => s.bestE1rm !== null)
    .map((s) => ({ t: s.date.getTime(), value: Math.round(s.bestE1rm!) }))
  if (e1rmPoints.length >= 2) {
    return {
      title: 'Estimated 1RM',
      unit: 'kg',
      format: (v) => `${v} kg`,
      points: e1rmPoints,
    }
  }

  const repsPoints = sessions
    .filter((s) => s.topSet?.weightKg == null && s.topSet?.reps != null)
    .map((s) => ({ t: s.date.getTime(), value: s.topSet!.reps! }))
  if (repsPoints.length >= 2) {
    return {
      title: 'Best set reps',
      unit: 'reps',
      format: (v) => `${v} reps`,
      points: repsPoints,
    }
  }

  const durationPoints = sessions
    .filter((s) => s.topSet?.durationSeconds != null)
    .map((s) => ({ t: s.date.getTime(), value: s.topSet!.durationSeconds! }))
  if (durationPoints.length >= 2) {
    return {
      title: 'Best set duration',
      unit: 'duration',
      format: formatSeconds,
      points: durationPoints,
    }
  }

  return null
}

function ProgressionChart({ sessions }: ProgressionChartProps) {
  const { ref, width } = useElementWidth<HTMLElement>()
  const series = buildSeries(sessions)
  if (!series) return null

  const dot = {
    r: 4,
    fill: 'var(--chart-series)',
    stroke: 'var(--chart-surface)',
    strokeWidth: 2,
  }
  // On narrow screens crowded markers melt into a blob — keep them only
  // when each point gets enough horizontal room; the line carries the shape.
  const showDots = width > 0 && width / series.points.length >= 12
  const tickCount = width > 0 && width < 440 ? 4 : 6

  return (
    <section
      ref={ref}
      aria-label={`${series.title} over time`}
      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {series.title}{' '}
        <span className="font-normal text-neutral-500 dark:text-neutral-400">
          ({series.unit})
        </span>
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={series.points}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ms: number) => formatDateShort(new Date(ms))}
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickCount={tickCount}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-muted)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as
                | { t: number; value: number }
                | undefined
              if (!active || !point) return null
              return (
                <ChartTooltip
                  title={formatDate(new Date(point.t))}
                  value={series.format(point.value)}
                  label={series.title.toLowerCase()}
                />
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--chart-series)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={showDots ? dot : false}
            activeDot={{ ...dot, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}

export default ProgressionChart
