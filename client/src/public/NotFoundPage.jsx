import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui'

const HOME_BY_ROLE = {
  ADMIN: '/admin/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
  FREELANCER: '/freelancer/dashboard',
}

export default function NotFoundPage() {
  const role = useAuthStore((state) => state.role)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const home = (isAuthenticated && HOME_BY_ROLE[role]) || '/'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary ring-1 ring-inset ring-primary-100">
        <Compass className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <p className="font-display text-5xl font-extrabold tracking-tight text-text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold text-text-primary">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link to={home} className="mt-6">
        <Button>Back to {home === '/' ? 'home' : 'dashboard'}</Button>
      </Link>
    </div>
  )
}
