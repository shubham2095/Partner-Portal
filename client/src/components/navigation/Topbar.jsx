import { PanelLeft, Menu, LogOut, Search } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import Avatar from '../ui/Avatar'
import Dropdown from './Dropdown'
import ThemeToggle from './ThemeToggle'

export default function Topbar({ showMobileMenuToggle = false, onOpenSearch }) {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const displayName = user?.full_name ?? user?.email ?? 'Account'
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ').toLowerCase() : null

  const iconButton =
    'inline-flex items-center justify-center rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring-visible'

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-1">
        {showMobileMenuToggle && (
          <button onClick={toggleMobileNav} className={`-ml-1 ${iconButton} sm:hidden`} aria-label="Open navigation menu">
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <button
          onClick={toggleSidebar}
          className={`-ml-1 hidden ${iconButton} sm:inline-flex`}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface-muted/60 px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text-secondary sm:inline-flex"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" strokeWidth={2} />
            <span>Search</span>
            <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 font-sans text-[0.6875rem] font-semibold text-text-muted">
              ⌘K
            </kbd>
          </button>
        )}
        {onOpenSearch && (
          <button onClick={onOpenSearch} className={`${iconButton} sm:hidden`} aria-label="Open search">
            <Search className="h-5 w-5" strokeWidth={2} />
          </button>
        )}

        <ThemeToggle />

        <Dropdown
          trigger={
            <span className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-muted">
              <Avatar name={displayName} size={32} />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[12rem] truncate text-sm font-semibold leading-tight text-text-primary">
                  {displayName}
                </span>
                {roleLabel && (
                  <span className="block text-xs capitalize leading-tight text-text-muted">{roleLabel}</span>
                )}
              </span>
            </span>
          }
          items={[{ label: 'Log out', onClick: logout, danger: true, icon: LogOut }]}
        />
      </div>
    </header>
  )
}
