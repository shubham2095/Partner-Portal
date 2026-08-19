import Button from './Button'

export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-danger/30 bg-danger-bg py-16 text-center">
      <h3 className="text-base font-semibold text-danger">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  )
}
