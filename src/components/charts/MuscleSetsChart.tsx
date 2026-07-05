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
import { formatCompact } from '../../utils/format'
import type { MuscleGroupStat } from '../../hooks/useMuscleStats'
import { MUSCLE_LABELS } from '../../muscles/taxonomy'

interface MuscleSetsChartProps {
  groups: MuscleGroupStat[]
  title?: string
}

const ROW_HEIGHT = 34

function MuscleSetsChart({
  groups,
  title = 'Working sets by muscle group',
}: MuscleSetsChartProps) {
  if (groups.length === 0) return null

  const data = groups.map((g) => ({
    ...g,
    label: MUSCLE_LABELS[g.group],
  }))

  return (
    <section
      aria-label={title}
      className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <ResponsiveContainer
        width="100%"
        height={data.length * ROW_HEIGHT + 32}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
          <XAxis
            type="number"
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={104}
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-cursor)' }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as
                | (MuscleGroupStat & { label: string })
                | undefined
              if (!active || !point) return null
              return (
                <ChartTooltip
                  title={point.label}
                  value={`${point.sets} sets`}
                  label={
                    point.volumeKg > 0
                      ? `· ${formatCompact(point.volumeKg)} kg`
                      : ''
                  }
                />
              )
            }}
          />
          <Bar
            dataKey="sets"
            fill="var(--chart-series)"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default MuscleSetsChart
