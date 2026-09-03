import EmptyState from '../ui/EmptyState'

export default function Timeline({ items = [] }) {
  if (!items.length) return <EmptyState title="No activity yet" />

  return (
    <ol className="relative ms-1 border-s-2 border-border ps-5">
      {items.map((item) => (
        <li key={item.id} className="relative mb-6 last:mb-0">
          <span className="absolute -start-[27px] top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-primary ring-4 ring-primary/10" />
          <p className="text-sm font-medium text-text-primary">{item.title}</p>
          {item.description && <p className="mt-0.5 text-sm text-text-secondary">{item.description}</p>}
          {item.timestamp && <p className="mt-1 text-xs text-text-muted">{item.timestamp}</p>}
        </li>
      ))}
    </ol>
  )
}
