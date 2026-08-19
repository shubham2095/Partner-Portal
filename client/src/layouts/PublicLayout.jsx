import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="border-b border-border bg-surface px-6 py-4">
        <span className="text-lg font-semibold text-text-primary">Partner Portal</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
