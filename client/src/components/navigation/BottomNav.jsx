import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

export default function BottomNav({ items = [] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md sm:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[0.6875rem] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-text-muted'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                  isActive && 'bg-primary-50'
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} />}
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
