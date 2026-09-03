import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  title = 'Unable to load this page',
  description = 'Something went wrong while fetching this data.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-danger/25 bg-danger-bg px-6 py-16 text-center">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-danger shadow-xs ring-1 ring-inset ring-danger/20">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-danger">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  )
}
