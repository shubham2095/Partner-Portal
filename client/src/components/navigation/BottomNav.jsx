import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

export default function BottomNav({ items = [] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface sm:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium',
              isActive ? 'text-primary' : 'text-text-secondary'
            )
          }
        >
          {item.icon && <item.icon className="h-5 w-5" strokeWidth={2} />}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
