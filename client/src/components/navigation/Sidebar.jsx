import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useUiStore } from '../../store/uiStore'

export default function Sidebar({ items = [], title = 'Partner Portal' }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen)

  return (
    <aside
      className={cn(
        'flex flex-col border-e border-border bg-surface transition-all',
        isSidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4 font-semibold text-text-primary">
        {isSidebarOpen ? title : title[0]}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
              )
            }
          >
            {item.icon}
            {isSidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
