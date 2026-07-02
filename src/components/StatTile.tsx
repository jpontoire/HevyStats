interface StatTileProps {
  label: string
  value: string
  detail?: string
}

function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-left dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {detail}
        </p>
      )}
    </div>
  )
}

export default StatTile
