import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import Avatar from '../ui/Avatar'
import Dropdown from './Dropdown'

export default function Topbar() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
      <button
        onClick={toggleSidebar}
        className="rounded p-2 text-text-secondary hover:bg-surface-muted focus-ring"
        aria-label="Toggle sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search..."
          className="hidden w-64 rounded border border-border bg-background px-3 py-1.5 text-sm focus-ring sm:block"
        />
        <Dropdown
          trigger={<Avatar name={user?.name ?? 'User'} size={32} />}
          items={[
            { label: 'Profile', onClick: () => {} },
            { label: 'Log out', onClick: logout, danger: true },
          ]}
        />
      </div>
    </header>
  )
}
