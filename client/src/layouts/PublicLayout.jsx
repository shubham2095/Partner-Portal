import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../components/ui'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="border-b border-border bg-surface px-6 py-4">
        <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-8 w-auto" />
      </header>
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
