import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted" strokeWidth={2} />}
            {item.href ? (
              <Link to={item.href} className="rounded transition-colors hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
