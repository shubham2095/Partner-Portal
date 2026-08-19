import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-card">
        <h1 className="mb-6 text-center text-xl font-semibold text-text-primary">Partner Portal</h1>
        <Outlet />
      </div>
    </div>
  )
}
