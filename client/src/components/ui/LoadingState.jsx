export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
      <span className="relative flex h-8 w-8">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
