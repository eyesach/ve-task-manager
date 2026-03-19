interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-text-tertiary">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 text-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
