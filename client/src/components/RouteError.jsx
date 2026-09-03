import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui'

// Router-level error boundary. Catches render/loader errors and 404s from
// react-router so the app never drops to a blank white screen.
export default function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()

  const is404 = isRouteErrorResponse(error) && error.status === 404
  const title = is404 ? 'Page not found' : 'Something went wrong'
  const detail = is404
    ? 'The page you’re looking for doesn’t exist or may have moved.'
    : 'An unexpected error interrupted this page. You can try again or head back.'

  if (import.meta.env.DEV && error) {
    // eslint-disable-next-line no-console
    console.error('[RouteError]', error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-bg text-danger ring-1 ring-inset ring-danger/20">
        <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{detail}</p>
      {import.meta.env.DEV && error?.message && (
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs text-text-muted">
          {String(error.message)}
        </pre>
      )}
      <div className="mt-6 flex gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/')}>Home</Button>
      </div>
    </div>
  )
}
