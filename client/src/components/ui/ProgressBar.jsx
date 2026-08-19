export default function ProgressBar({ value = 0, max = 100 }) {
  const percentage = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
    </div>
  )
}
