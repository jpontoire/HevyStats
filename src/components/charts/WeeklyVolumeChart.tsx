import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { formatCompact, formatDateShort } from '../../utils/format'
import type { WeeklyVolume } from '../../utils/stats'

interface WeeklyVolumeChartProps {
  weeks: WeeklyVolume[]
}

function WeeklyVolumeChart({ weeks }: WeeklyVolumeChartProps) {
  if (weeks.length < 2) return null

  const data = weeks.map((week) => ({
    weekStart: week.weekStart.getTime(),
    volumeKg: Math.round(week.volumeKg),
  }))

  return (
    <section
      aria-label="Weekly volume"
      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Weekly volume{' '}
        <span className="font-normal text-neutral-500 dark:text-neutral-400">
          (kg)
        </span>
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
          <XAxis
            dataKey="weekStart"
            tickFormatter={(ms: number) => formatDateShort(new Date(ms))}
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            minTickGap={48}
          />
          <YAxis
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as
                | { weekStart: number; volumeKg: number }
                | undefined
              if (!active || !point) return null
              return (
                <ChartTooltip
                  title={`Week of ${formatDateShort(new Date(point.weekStart))}`}
                  value={`${formatCompact(point.volumeKg)} kg`}
                  label="volume"
                />
              )
            }}
          />
          <Bar
            dataKey="volumeKg"
            fill="var(--chart-series)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default WeeklyVolumeChart
