import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useUiStore } from '../../store/uiStore'

// Deliberately not framer-motion/AnimatePresence-driven: the drawer stays
// permanently mounted and slides via a CSS transform gated on isOpen. This
// sidesteps the AnimatePresence exit-unmount issue documented on the Modal
// component (see Modal.jsx) entirely, since there is never an unmount to
// get stuck on — only a transform + pointer-events toggle.
export default function MobileNavDrawer({ items = [], title = 'Partner Portal' }) {
  const isOpen = useUiStore((state) => state.isMobileNavOpen)
  const closeMobileNav = useUiStore((state) => state.closeMobileNav)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') closeMobileNav()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeMobileNav])

  return (
    <div
      className={cn('fixed inset-0 z-40 sm:hidden', isOpen ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeMobileNav}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} navigation`}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-surface shadow-elevated transition-transform duration-200 focus:outline-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-7 w-auto" />
          <button
            onClick={closeMobileNav}
            className="rounded-md p-1.5 text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-ring"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) =>
            item.section ? (
              <div key={`section-${item.section}`} className="px-3 pb-1 pt-4 text-caption first:pt-1">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileNav}
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
                <span className="truncate">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </div>
    </div>
  )
}
