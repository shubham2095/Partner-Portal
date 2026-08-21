import { PanelLeft, Menu } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import Avatar from '../ui/Avatar'
import Dropdown from './Dropdown'

export default function Topbar({ showMobileMenuToggle = false }) {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const displayName = user?.full_name ?? user?.email ?? 'Account'

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      {showMobileMenuToggle && (
        <button
          onClick={toggleMobileNav}
          className="inline-flex rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring sm:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      )}
      <button
        onClick={toggleSidebar}
        className="hidden rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-ring sm:inline-flex"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="h-5 w-5" strokeWidth={2} />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted">
              <Avatar name={displayName} size={32} />
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-text-primary sm:inline">
                {displayName}
              </span>
            </span>
          }
          items={[{ label: 'Log out', onClick: logout, danger: true }]}
        />
      </div>
    </header>
  )
}
