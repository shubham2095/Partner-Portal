import { cn } from '../../utils/cn'

const TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export default function ProgressBar({ value = 0, max = 100, tone = 'primary', showLabel = false, className }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-smooth', TONES[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-text-secondary">
          {percentage}%
        </span>
      )}
    </div>
  )
}
