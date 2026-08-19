import EmptyState from '../ui/EmptyState'

export default function Timeline({ items = [] }) {
  if (!items.length) return <EmptyState title="No activity yet" />

  return (
    <ol className="relative border-s border-border ps-4">
      {items.map((item) => (
        <li key={item.id} className="mb-6 last:mb-0">
          <span className="absolute -start-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
          <p className="text-sm font-medium text-text-primary">{item.title}</p>
          {item.description && (
            <p className="text-sm text-text-secondary">{item.description}</p>
          )}
          <p className="text-xs text-text-muted">{item.timestamp}</p>
        </li>
      ))}
    </ol>
  )
}
