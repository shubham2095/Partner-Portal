import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../components/ui'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-card">
        <img src="/heltog-logo.webp" alt="Heltog Technologies" className="mx-auto mb-6 h-10 w-auto" />
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
