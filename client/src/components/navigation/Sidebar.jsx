import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useUiStore } from '../../store/uiStore'

// `items` accepts a flat array of { to, label, icon: LucideIcon } for
// top-level entries, or a mix including { section: 'LABEL' } markers that
// start a new labelled group in the collapsed-vs-expanded sidebar below.
export default function Sidebar({ items = [], title = 'Partner Portal' }) {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen)

  return (
    <aside
      className={cn(
        'flex flex-col border-e border-border bg-surface transition-all duration-200',
        isSidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        {isSidebarOpen ? (
          <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-7 w-auto" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            {title[0]}
          </div>
        )}
      </div>
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) =>
          item.section ? (
            <div
              key={`section-${item.section}`}
              className={cn(
                'px-3 pb-1 pt-4 text-caption first:pt-1',
                !isSidebarOpen && 'sr-only'
              )}
            >
              {item.section}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isSidebarOpen ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                )
              }
            >
              {item.icon && <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />}
              {isSidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  )
}
