import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { PageLoader } from '../components/ui'
import { ThemeToggle } from '../components/navigation'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/85 px-4 py-3.5 backdrop-blur-md sm:px-6">
        <img src="/heltog-logo.webp" alt="Heltog Technologies" className="h-8 w-auto" />
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
