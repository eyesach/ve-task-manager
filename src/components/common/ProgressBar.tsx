export function ProgressBar({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  if (total === 0) return null

  const pct = Math.round((completed / total) * 100)
  const isComplete = completed === total

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-4">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: isComplete ? '#10B981' : '#3B82F6',
          }}
        />
      </div>
      <span className="whitespace-nowrap font-mono text-[11px] text-text-tertiary">
        {completed}/{total}
      </span>
    </div>
  )
}
