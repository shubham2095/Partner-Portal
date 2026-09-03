import { cn } from '../../utils/cn'

export default function Card({
  children,
  className,
  elevated = false,
  interactive = false,
  padded = true,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface',
        padded && 'p-5',
        elevated ? 'shadow-elevated' : 'shadow-card',
        interactive && 'card-interactive cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
