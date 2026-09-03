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
        'flex flex-col border-e border-border bg-surface transition-[width] duration-200 ease-smooth',
        isSidebarOpen ? 'w-64' : 'w-[68px]'
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        {isSidebarOpen ? (
          <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-7 w-auto" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-xs">
            {title[0]}
          </div>
        )}
      </div>
      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) =>
          item.section ? (
            <div
              key={`section-${item.section}`}
              className={cn(
                'px-3 pb-1.5 pt-5 text-caption first:pt-1',
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
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  !isSidebarOpen && 'justify-center',
                  isActive
                    ? 'bg-primary-50 text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-150',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.icon && (
                    <item.icon
                      className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive && 'text-primary')}
                      strokeWidth={2}
                    />
                  )}
                  {isSidebarOpen && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  )
}
