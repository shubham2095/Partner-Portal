export default function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
