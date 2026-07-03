interface ChartTooltipProps {
  title: string
  value: string
  label: string
}

/** Shared tooltip box: value leads (strong), series label follows (muted). */
function ChartTooltip({ title, value, label }: ChartTooltipProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="mt-0.5">
        <span className="inline-block h-0.5 w-3 -translate-y-1 rounded bg-[var(--chart-series)]" />{' '}
        <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
          {value}
        </strong>{' '}
        <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      </p>
    </div>
  )
}

export default ChartTooltip
