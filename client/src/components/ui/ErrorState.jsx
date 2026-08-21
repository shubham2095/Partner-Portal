import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({
  title = 'Unable to load this page',
  description = 'Something went wrong while fetching this data.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger-bg py-16 text-center">
      <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-danger">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
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
